const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Client } = require('ssh2');
const cors = require('cors');
const fetch = require('node-fetch');

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
const HEARTBEAT_INTERVAL = 15000;  // Send ping every 15 seconds

// Store active SSH connections per WebSocket client
const sshConnectionsByClient = new Map();
const activeWebSockets = new Set();

function heartbeat(ws) {
  // Just send a ping to keep the connection alive
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
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
  wsConnections.add(ws);  // Add to wsConnections set
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

  ws.on('message', async (message) => {
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

      if (data.type === 'start_pentest') {
        console.log('\n=== Starting Pentest ===');
        console.log('Target:', data.target);
        console.log('Mode:', data.headlessMode ? 'Autonomous' : 'Manual');
        console.log('AI Config:', data.ai);

        // Store pentest context for this WebSocket connection
        const pentestContext = {
          target: data.target,
          mode: data.headlessMode ? 'Autonomous' : 'Manual',
          aiConfig: data.ai,
          commandHistory: [],
          isActive: true
        };
        ws.pentestContext = pentestContext;

        // Send acknowledgment
        ws.send(JSON.stringify({
          type: 'system',
          content: `Starting ${data.headlessMode ? 'autonomous' : 'manual'} pentest on ${data.target}`
        }));

        // Function to validate command
        const validateCommand = (command) => {
          // List of allowed commands/tools
          const allowedCommands = [
            'nmap', 'whois', 'dig', 'nikto', 'dirb', 'gobuster',
            'sqlmap', 'hydra', 'medusa', 'metasploit', 'msfconsole',
            'curl', 'wget', 'netcat', 'nc', 'telnet', 'ssh', 'ftp'
          ];

          // Check if command is empty or undefined
          if (!command) {
            return { valid: false, reason: 'Command is empty' };
          }

          // Check if command starts with any allowed tool
          const commandLower = command.toLowerCase();
          const isAllowed = allowedCommands.some(tool => commandLower.startsWith(tool));
          
          if (!isAllowed) {
            return { 
              valid: false, 
              reason: `Command must start with one of: ${allowedCommands.join(', ')}` 
            };
          }

          // Check for potentially dangerous commands
          const dangerousPatterns = [
            'rm -rf', 'mkfs', 'dd if=', '> /dev/sd',
            'chmod -R 777', 'chown -R root:root'
          ];

          const isDangerous = dangerousPatterns.some(pattern => 
            commandLower.includes(pattern)
          );

          if (isDangerous) {
            return { 
              valid: false, 
              reason: 'Command contains potentially dangerous operations' 
            };
          }

          return { valid: true };
        };

        // Function to handle AI communication
        const handleAICommunication = async (question) => {
          try {
            const response = await fetch(`${data.ai.flowiseEndpoint}/api/v1/prediction/${data.ai.flowiseChatflowId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ question })
            });
            
            const aiResponse = await response.json();
            console.log('Flowise response:', aiResponse);
            
            // Extract JSON response from the text, ignoring thinking process
            let jsonResponse = null;
            try {
              // First try to parse the entire response as JSON
              jsonResponse = JSON.parse(aiResponse.text);
            } catch (e) {
              // If that fails, try to extract JSON from code blocks or after <think> section
              const jsonMatch = aiResponse.text.match(/(?:```json\n([\s\S]*?)\n```|<\/think>\n([\s\S]*))/);
              if (jsonMatch) {
                try {
                  // Use either the code block content or the content after </think>
                  const jsonContent = jsonMatch[1] || jsonMatch[2];
                  jsonResponse = JSON.parse(jsonContent);
                } catch (e) {
                  console.error('Failed to parse JSON response:', e);
                  ws.send(JSON.stringify({
                    type: 'error',
                    content: 'Invalid response format from AI'
                  }));
                  return;
                }
              }
            }

            if (jsonResponse && jsonResponse.command) {
              console.log('Parsed AI command:', jsonResponse);
              // Validate command
              const validation = validateCommand(jsonResponse.command);
              if (!validation.valid) {
                console.log('Command validation failed:', validation.reason);
                ws.send(JSON.stringify({
                  type: 'error',
                  content: `Command validation failed: ${validation.reason}`
                }));
                return;
              }

              // Add command to history
              pentestContext.commandHistory.push({
                command: jsonResponse.command,
                timestamp: new Date().toISOString()
              });

              // Send command to frontend for execution
              console.log('Sending command to frontend:', jsonResponse.command);
              const commandMessage = JSON.stringify({
                type: 'command',
                command: jsonResponse.command,
                connection: ws.pentestContext.connection
              });
              
              // Check if WebSocket is still open
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(commandMessage);
                console.log('Command sent successfully');
              } else {
                console.error('WebSocket connection lost');
                throw new Error('WebSocket connection lost');
              }
            } else {
              console.log('No command received from AI');
              ws.send(JSON.stringify({
                type: 'error',
                content: 'No command received from AI'
              }));
            }
          } catch (error) {
            console.error('Flowise request failed:', error);
            ws.send(JSON.stringify({
              type: 'error',
              content: 'Failed to communicate with AI'
            }));
          }
        };

        // Set up ping interval to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000); // Send ping every 30 seconds

        // Clean up on connection close
        ws.on('close', () => {
          console.log('WebSocket connection closed, cleaning up...');
          clearInterval(pingInterval);
          if (ws.pentestContext) {
            ws.pentestContext.isActive = false;
          }
        });

        // Initial question to AI
        const initialQuestion = `Starting pentest on ${data.target}. Additional info: ${data.additionalInfo || 'None'}. ` +
          `This is an autonomous pentest. Please analyze the target and suggest appropriate tools and techniques. ` +
          `System prompt: ${data.ai.systemPrompt.systemPrompt}`;

        handleAICommunication(initialQuestion);

        // Handle command output and stop command
        ws.on('message', async (message) => {
          try {
            const messageData = JSON.parse(message);
            
            // Handle stop command
            if (messageData.type === 'stop_pentest' && ws.pentestContext) {
              ws.pentestContext.isActive = false;
              ws.send(JSON.stringify({
                type: 'system',
                content: 'Pentest stopped by user'
              }));
              return;
            }
            
            if (messageData.type === 'command_output' && ws.pentestContext && ws.pentestContext.isActive) {
              const { command, output } = messageData;
              
              // Update command history with output
              const lastCommand = ws.pentestContext.commandHistory[ws.pentestContext.commandHistory.length - 1];
              if (lastCommand) {
                lastCommand.output = output;
              }

              // Prepare follow-up question with context
              const followUpQuestion = `Command "${command}" was executed. Here is the output:\n${output}\n\n` +
                `Based on this output and the previous commands, what should be the next step in the penetration test? ` +
                `Remember we are testing ${ws.pentestContext.target} and our goal is to identify security vulnerabilities.`;

              // Get next command from AI
              await handleAICommunication(followUpQuestion);
            }
          } catch (e) {
            console.error('Failed to handle command output:', e);
          }
        });

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
        if (clientSshConnections && clientSshConnections.has(connectionId)) {
          console.log('=== Reusing Existing SSH Connection ===', connectionId);
          const existingClient = clientSshConnections.get(connectionId);
          // If we have a shell stream, write to it
          if (existingClient.shellStream) {
            console.log('Writing to existing shell stream');
            existingClient.shellStream.write(command + '\n');
            return;
          }
          // Otherwise, create a new shell
          console.log('Creating new shell session for existing connection');
          createShellSession(existingClient, ws, connectionId);
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
            
            // Store this newly connected and tested client
            const clientSshConnections = sshConnectionsByClient.get(ws);
            if (!clientSshConnections) {
                console.error("Critical: clientSshConnections Map missing for this WebSocket. Aborting.");
                newlyConnectedClient.end();
                ws.send(JSON.stringify({ type: 'error', message: 'Internal server error while establishing SSH.' }));
                return;
            }

            clientSshConnections.set(connectionId, newlyConnectedClient);
            console.log(`Stored new SSH client for ${connectionId}`);

            // Set up persistent error and close handlers
            newlyConnectedClient.on('error', (err) => {
              console.error(`=== Stored SSH Client Error (${connectionId}) ===`);
              console.error(err.message);
              ws.send(JSON.stringify({ type: 'error', message: `SSH connection error for ${connectionId}: ${err.message}` }));
              const currentClientSshMap = sshConnectionsByClient.get(ws);
              if (currentClientSshMap) {
                currentClientSshMap.delete(connectionId);
                console.log(`Removed SSH client ${connectionId} due to error.`);
              }
              newlyConnectedClient.end();
            });
      
            newlyConnectedClient.on('close', () => {
              console.log(`=== Stored SSH Client Closed (${connectionId}) ===`);
              const currentClientSshMap = sshConnectionsByClient.get(ws);
              if (currentClientSshMap) {
                currentClientSshMap.delete(connectionId);
                console.log(`Removed SSH client ${connectionId} due to close event.`);
              }
            });
            
            // Create a shell session
            console.log('Creating new shell session');
            createShellSession(newlyConnectedClient, ws, connectionId);
          })
          .catch((err) => {
            console.error('\n=== Connection Test Promise Rejected ===');
            console.error('Error:', err.message);
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
    wsConnections.delete(ws);  // Remove from wsConnections set
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
    wsConnections.delete(ws);  // Remove from wsConnections set
    
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
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  });
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
  clearInterval(interval);
});

// Function to execute a command via SSH
async function executeCommand(command, connection) {
  console.log('\n=== Command Execution ===');
  console.log('Command:', command);
  console.log('Connection details:', {
    host: connection.host,
    port: connection.port,
    username: connection.username,
    useSshKey: connection.useSshKey
  });
  
  return new Promise((resolve, reject) => {
    const conn = new Client();
    
    conn.on('ready', () => {
      console.log('SSH connection ready, executing command...');
      conn.exec(command, (err, stream) => {
        if (err) {
          console.error('Error executing command:', err);
          reject(err);
          return;
        }
        
        let output = '';
        stream.on('data', (data) => {
          const chunk = data.toString();
          console.log('Command output chunk:', chunk);
          output += chunk;
        });
        
        stream.on('close', () => {
          console.log('Command execution complete');
          console.log('Full command output:', output);
          conn.end();
          resolve(output);
        });
        
        stream.on('error', (err) => {
          console.error('Stream error:', err);
          conn.end();
          reject(err);
        });
      });
    });
    
    conn.on('error', (err) => {
      console.error('SSH connection error:', err);
      reject(err);
    });
    
    // Connect to the SSH server
    const config = {
      host: connection.host,
      port: connection.port,
      username: connection.username,
      password: connection.password,
      readyTimeout: 20000,
      keepaliveInterval: 10000
    };
    
    console.log('Connecting to SSH server with config:', {
      ...config,
      password: config.password ? '******' : undefined
    });
    
    try {
      conn.connect(config);
    } catch (error) {
      console.error('Error connecting to SSH server:', error);
      reject(error);
    }
  });
}

function createShellSession(sshClient, ws, connectionId) {
  sshClient.shell({ term: 'xterm-256color', cols: 80, rows: 24 }, (err, stream) => {
    if (err) {
      console.error('Error creating shell session:', err.message);
      ws.send(JSON.stringify({ type: 'error', message: `Failed to create shell session: ${err.message}` }));
      return;
    }

    // Store the shell stream
    sshClient.shellStream = stream;

    // Handle shell output
    stream.on('data', (data) => {
      const dataStr = data.toString();
      console.log('Shell output:', dataStr);
      ws.send(JSON.stringify({ 
        type: 'output', 
        content: dataStr.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      }));
    });

    // Handle shell errors
    stream.stderr.on('data', (data) => {
      const errorStr = data.toString();
      console.error('Shell error:', errorStr);
      ws.send(JSON.stringify({ 
        type: 'error', 
        content: errorStr.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      }));
    });

    // Handle shell close
    stream.on('close', () => {
      console.log('Shell session closed');
      ws.send(JSON.stringify({ 
        type: 'system', 
        content: 'Shell session closed\n'
      }));
      delete sshClient.shellStream;
    });

    // Handle terminal resize
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'resize') {
          stream.setWindow(data.rows, data.cols, 0, 0);
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
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