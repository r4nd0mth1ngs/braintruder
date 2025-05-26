const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Client } = require('ssh2');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ 
  server,
  clientTracking: true,
  perMessageDeflate: false,
  heartbeatInterval: 30000
});

// Store active SSH connections
const sshConnections = new Map();

// Keep track of active WebSocket connections
const wsConnections = new Set();

// Heartbeat interval for all connections
const HEARTBEAT_INTERVAL = 30000;
const CLIENT_TIMEOUT = 35000;

// Store active SSH connections per WebSocket client
const sshConnectionsByClient = new Map();
const activeWebSockets = new Set();

function heartbeat(ws) {
  ws.isAlive = true;
  ws.lastPing = Date.now();
}

function testSSHConnection(config, ws, connectionId) {
  return new Promise((resolve, reject) => {
    console.log('=== Starting SSH Connection Test ===');
    console.log('Attempting to connect to:', config.host);
    
    const testClient = new Client();
    
    testClient.on('ready', () => {
      console.log('✓ SSH connection test successful (client ready)');
      // Don't end the client here, resolve with it
      resolve(testClient); 
    });

    testClient.on('error', (err) => {
      console.error('✗ SSH connection test failed during connection attempt:', err.message);
      ws.send(JSON.stringify({ type: 'error', message: `SSH connection setup error: ${err.message}` }));
      testClient.end(); // End only on error
      reject(err);
    });

    console.log('Initiating SSH connection test...');
    testClient.connect(config);
  });
}

wss.on('connection', (ws) => {
  console.log('\n=== New WebSocket Connection ===');
  activeWebSockets.add(ws);
  ws.isAlive = true;
  // Initialize a new Map for this client's SSH connections if it doesn't exist
  if (!sshConnectionsByClient.has(ws)) {
    sshConnectionsByClient.set(ws, new Map());
  }

  // Send initial connection success message
  ws.send(JSON.stringify({
    type: 'system',
    content: 'Connected to server'
  }));

  // Set up ping-pong
  ws.on('pong', () => {
    heartbeat(ws);
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('\n=== Received Message ===');
      console.log('Message type:', data.type);
      console.log('Full message:', JSON.stringify(data, null, 2));

      // Handle ping messages
      if (data.type === 'ping') {
        heartbeat(ws);
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      if (data.type === 'command') {
        const { command, connection } = data;
        const connectionId = `${connection.host}:${connection.port}:${connection.username}`;
        
        console.log('\n=== Processing Command ===');
        console.log('Command:', command);
        console.log('Target:', connectionId);
        console.log('Connection details:', {
          host: connection.host,
          port: connection.port,
          username: connection.username,
          useSshKey: connection.useSshKey
        });

        // Check if an SSH connection for this ID already exists for this client
        const clientSshConnections = sshConnectionsByClient.get(ws);
        if (clientSshConnections.has(connectionId)) {
          const existingClient = clientSshConnections.get(connectionId);
          // TODO: Check if existingClient is still valid/ready
          // For now, assume it is and try to execute the command
          console.log('=== Reusing Existing SSH Connection ===', connectionId);
          executeCommand(existingClient, command, ws, connectionId);
          return;
        }

        console.log('=== Creating New SSH Connection ===');
        const sshClient = new Client();

        // Connect to SSH server
        const config = {
          host: connection.host,
          port: connection.port,
          username: connection.username,
          readyTimeout: 20000,
          keepaliveInterval: 10000
        };

        if (connection.useSshKey) {
          console.log('Authentication: Using SSH key');
          config.privateKey = connection.sshKey;
        } else {
          console.log('Authentication: Using password');
          config.password = connection.password;
        }

        // First test the connection and get the client if successful
        testSSHConnection(config, ws, connectionId)
          .then((newlyConnectedClient) => {
            console.log('\n=== Connection Test Succeeded, Obtained SSH Client ===');
            
            // At this point, newlyConnectedClient is the ready SSH client from testSSHConnection
            const clientSshConnections = sshConnectionsByClient.get(ws);
            if (!clientSshConnections) {
                console.error("Critical: clientSshConnections Map missing for this WebSocket. Aborting.");
                newlyConnectedClient.end();
                ws.send(JSON.stringify({ type: 'error', message: 'Internal server error while establishing SSH.' }));
                return;
            }

            // Store this newly connected and tested client
            clientSshConnections.set(connectionId, newlyConnectedClient);
            console.log(`Stored new SSH client for ${connectionId}`);

            // Set up persistent error and close handlers for this stored client
            newlyConnectedClient.on('error', (err) => {
              console.error(`=== Stored SSH Client Error (${connectionId}) ===`);
              console.error(err.message);
              ws.send(JSON.stringify({ type: 'error', message: `SSH connection error for ${connectionId}: ${err.message}` }));
              const currentClientSshMap = sshConnectionsByClient.get(ws);
              if (currentClientSshMap) {
                currentClientSshMap.delete(connectionId);
                console.log(`Removed SSH client ${connectionId} due to error.`);
              }
              newlyConnectedClient.end(); // Ensure it's ended
            });
      
            newlyConnectedClient.on('close', () => {
              console.log(`=== Stored SSH Client Closed (${connectionId}) ===`);
              const currentClientSshMap = sshConnectionsByClient.get(ws);
              if (currentClientSshMap) {
                currentClientSshMap.delete(connectionId);
                console.log(`Removed SSH client ${connectionId} due to close event.`);
              }
            });
            
            // Now execute the command with the newly stored client
            executeCommand(newlyConnectedClient, command, ws, connectionId);
          })
          .catch((err) => {
            console.error('\n=== Connection Test Promise Rejected ===');
            console.error('Error:', err.message);
            // Error already sent to client by testSSHConnection or other error handlers
            // ws.send(JSON.stringify({ 
            //   type: 'error', 
            //   message: `SSH connection failed: ${err.message}. Please ensure SSH server is running on the target machine.` 
            // }));
          });
      }
    } catch (error) {
      console.error('\n=== Error Processing Message ===');
      console.error('Error:', error.message);
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('\n=== WebSocket Connection Closed ===');
    activeWebSockets.delete(ws);
    // Clean up all SSH connections associated with this client
    const clientSshConnections = sshConnectionsByClient.get(ws);
    if (clientSshConnections) {
      console.log('Cleaning up SSH connections for this client');
      for (const [connectionId, sshClient] of clientSshConnections) {
        console.log(`Closing SSH connection: ${connectionId}`);
        sshClient.end();
      }
      sshConnectionsByClient.delete(ws); // Remove the client's entire SSH map
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('\n=== WebSocket Error ===');
    console.error('Error:', error.message);
    activeWebSockets.delete(ws);
    
    // Clean up SSH connections on error
    const clientSshConnections = sshConnectionsByClient.get(ws);
    if (clientSshConnections) {
      for (const [id, sshClient] of clientSshConnections) {
        sshClient.end();
      }
      sshConnectionsByClient.delete(ws);
    }
  });
});

// Set up heartbeat interval
const interval = setInterval(() => {
  const now = Date.now();
  wss.clients.forEach((ws) => {
    if (!ws.isAlive || (now - ws.lastPing > CLIENT_TIMEOUT)) {
      console.log('Client connection timed out, terminating...');
      ws.terminate();
      return;
    }
    
    ws.isAlive = false;
    ws.send(JSON.stringify({ type: 'ping' }));
  });
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
  clearInterval(interval);
});

function executeCommand(sshClient, commandToExecute, ws, connectionId) {
  if (!sshClient || !sshClient._sock || !sshClient._sock.writable) { // Check if client or its socket is not usable
    console.error(`SSH client for ${connectionId} is not ready or already closed.`);
    ws.send(JSON.stringify({ type: 'error', message: `SSH connection for ${connectionId} is not active. Please try reconnecting.` }));
    
    // Attempt to remove this broken client from the map
    const clientSshConnections = sshConnectionsByClient.get(ws);
    if (clientSshConnections) {
        clientSshConnections.delete(connectionId);
    }
    return;
  }

  console.log(`Executing command on ${connectionId}: ${commandToExecute}`);
  
  sshClient.exec(commandToExecute, (err, stream) => {
    if (err) {
      console.error('✗ Command execution failed:', err.message);
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
      return;
    }

    let output = '';

    stream.on('data', (data) => {
      const dataStr = data.toString();
      console.log('Command output:', dataStr);
      output += dataStr;
      // Send each chunk of output immediately
      ws.send(JSON.stringify({ 
        type: 'output', 
        content: dataStr 
      }));
    });

    stream.on('close', (code, signal) => {
      console.log('\n=== Command Execution Completed ===');
      console.log('Exit code:', code);
      console.log('Signal:', signal);
      console.log('Full output:', output);
      
      // Send completion message
      ws.send(JSON.stringify({ 
        type: 'system', 
        content: `Command completed with exit code: ${code}` 
      }));
    });

    stream.on('error', (err) => {
      console.error('\n=== Stream Error ===');
      console.error('Error:', err.message);
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
    });

    stream.stderr.on('data', (data) => {
      const errorStr = data.toString();
      console.error('\n=== Command Error Output ===');
      console.error('Error:', errorStr);
      ws.send(JSON.stringify({ type: 'error', content: errorStr }));
    });
  });
}

// Keep track of active connections
setInterval(() => {
  console.log('\n=== Connection Status ===');
  console.log('Active WebSocket connections:', wsConnections.size);
  console.log('Active SSH connections:', sshConnections.size);
}, 30000);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`\n=== Server Started ===`);
  console.log(`Server is running on port ${PORT}`);
}); 