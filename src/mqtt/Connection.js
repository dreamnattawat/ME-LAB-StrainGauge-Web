import React, { useEffect } from 'react';

const Connection = ({ connect, disconnect, connectBtn }) => {

  const mqttconfig = {
    host: "34.124.151.137",
    // host: "34.124.151.132",
    clientId: "mqttjs_" + Math.random().toString(16).substr(2, 8)
    , port: "9001"
    , username: "koko1234"
    , password: "koko1234"
  };


  const StartConnection = (values) => {
    const { host, clientId, port, username, password } = values;
    const url = `ws://${host}:${port}/mqtt`;
    const options = {
      keepalive: 30,
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      will: {
        topic: 'WillMsg',
        payload: 'Connection Closed abnormally..!',
        qos: 0,
        retain: false
      },
      rejectUnauthorized: false
    };
    options.clientId = clientId;
    options.username = username;
    options.password = password;
    connect(url, options);
  };


  const handleDisconnect = () => {
    disconnect();
  };

  useEffect(() => {
    StartConnection(mqttconfig);
  }, [])

  return (
    <div
      style={{
        width: '100%',
        textAlign: "center",
      }}
    >
      <div
        style={{
          paddingTop: 7,
          paddingBottom: 7,
          fontWeight: 500,
          backgroundColor: (connectBtn == "Connected" ? "#9ACD32" : "yellow"),
          color: (connectBtn == "Connected" ? "white" : "black")
        }}
        onClick={() => StartConnection(mqttconfig)}>{connectBtn} to server</div>
      {/* <div
        style={{ margin: 20 }}
        danger onClick={handleDisconnect}>Disconnect</div> */}
    </div>

  );
}

export default Connection;
