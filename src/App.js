import './App.css';
import React, { useState, useEffect, createContext } from 'react';
import Grid from '@mui/material/Grid';
import RTChart from 'react-rt-chart';
import { TimeSeries } from "pondjs";
import Table from "csv-react-table";
import {
  Charts,
  ChartContainer,
  ChartRow,
  YAxis,
  LineChart,
  Baseline,
  ResponsiveContainer
} from "react-timeseries-charts";

import Connection from './mqtt/Connection';
import Publisher from './mqtt/Publisher';
import Subscriber from './mqtt/Subscriber';
import Receiver from './mqtt/Receiver';
import mqtt from 'mqtt';

export const QosOption = createContext([])
const qosOption = [
  {
    label: '0',
    value: 0,
  }, {
    label: '1',
    value: 1,
  }, {
    label: '2',
    value: 2,
  },
];



function App() {



  // MQTT
  const [client, setClient] = useState(null);
  const [isSubed, setIsSub] = useState(false);

  const initpoints = [[Date.now(), 0]];
  const [points, setpoints] = useState(initpoints)

  const [gaguefactor, setgaguefactor] = useState(1)
  const [factor, setfactor] = useState(1)

  const [connectStatus, setConnectStatus] = useState('Connect');

  const [zerovalue, setzerovalue] = useState(0);
  // let zerovalue = 0;
  const refVolt = 4200;

  const mqttsubconfig = {
    topic: "sensor/strain",
    qos: 0
  }

  const mqttConnect = (host, mqttOption) => {
    setConnectStatus('Connecting');
    setClient(mqtt.connect(host, mqttOption));
  };
  useEffect(() => {
    if (client) {
      client.on('connect', () => {
        setConnectStatus('Connected');
      });
      client.on('error', (err) => {
        console.error('Connection error: ', err);
        client.end();
      });
      client.on('reconnect', () => {
        setConnectStatus('Reconnecting');
      });
      client.on('message', (topic, message) => {
        const payload = { topic, message: message.toString() };
        console.log(JSON.parse(message))
        const sensorvalue = JSON.parse(message);
        if (sensorvalue.sv) {
          let newpoint = [
            Date.now(), sensorvalue.sv
          ]
          setpoints((prevState) => {
            return ([...prevState, newpoint])
          });
        }
      });
    }
  }, [client]);
  // }, [zerovalue]);
  const mqttDisconnect = () => {
    if (client) {
      client.end(() => {
        setConnectStatus('Connect');
      });
    }
  }

  const mqttPublish = (context) => {
    if (client) {
      const { topic, qos, payload } = context;
      client.publish(topic, payload, { qos }, error => {
        if (error) {
          console.log('Publish error: ', error);
        }
      });
    }
  }

  const mqttSub = (subscription) => {
    if (client) {
      const { topic, qos } = subscription;
      client.subscribe(topic, { qos }, (error) => {
        if (error) {
          console.log('Subscribe to topics error', error)
          return
        }
        setIsSub(true)
        console.log("Subscribed to:", topic)
      });
    }
  };

  const mqttUnSub = (subscription) => {
    if (client) {
      const { topic } = subscription;
      client.unsubscribe(topic, error => {
        if (error) {
          console.log('Unsubscribe error', error)
          return
        }
        setIsSub(false);
        console.log("Unsubscribed :", topic)
      });
    }
  };













  // const [series, setseries] = useState(initseries);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     let newmember = {
  //       date: new Date(),
  //       Car: Math.random() * 100,
  //     };
  //     let newlist = [...series];
  //     newlist.push(newmember)
  //     setseries(newlist);

  //   }, 500);
  //   return () => clearInterval(interval);
  // }, [])


  // const data = require("./usd_vs_euro.json");
  // const points = data.widget[0].data.reverse();



  const series = new TimeSeries({
    name: "Strain gauge",
    columns: ["time", "value"],
    points: points.slice(-600).map(each => {
      return (
        [each[0], (2 * 10 ** 6 * (each[1] - zerovalue) / (gaguefactor * refVolt))]
      )
    }),
  });

  const style = {
    value: {
      stroke: "#a02c2c",
      opacity: 0.2
    }
  };

  const baselineStyle = {
    line: {
      stroke: "steelblue",
      strokeWidth: 1,
      opacity: 0.4,
      strokeDasharray: "none"
    },
    label: {
      fill: "steelblue"
    }
  };

  const baselineStyleLite = {
    line: {
      stroke: "steelblue",
      strokeWidth: 1,
      opacity: 0.5
    },
    label: {
      fill: "steelblue"
    }
  };

  const baselineStyleExtraLite = {
    line: {
      stroke: "steelblue",
      strokeWidth: 1,
      opacity: 0.2,
      strokeDasharray: "1,1"
    },
    label: {
      fill: "steelblue"
    }
  };

  const onChangeFactor = (e) => {
    setfactor(e.target.value)
  }


  return (
    <div className="App"
      style={{
        backgroundColor: "#2A363B",
        minHeight: "100vh",
        color: "white"
      }}
    >


      {/* app bar */}
      <div style={{
        width: "calc(100vw-40px)",
        boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
        backgroundColor: "#E84A5F",
        padding: 20,
        color: "white",
        fontSize: 30,
      }}>
        ME Lab at Home : Beam Stress Analysis
      </div>
      {/* Testing */}
      <Connection sub={mqttSub} connect={mqttConnect} disconnect={mqttDisconnect} connectBtn={connectStatus} />
      {/* Teting */}


      <Grid container spacing={1}>
        <Grid item xs={12} sm={6}>
          <div
            style={{
              backgroundColor: "white",
              padding: 20,
              borderRadius: 5,
              margin: 30,
            }}
          >
            {/* <RTChart
              color={"white"}
              maxValues={10}
              flow={100}
              fields={['Car']}
              data={data} /> */}

            <div>
              <ChartContainer
                title="Measured Microstrain from Strain gague"
                titleStyle={{ fill: "#555", fontWeight: 500 }}
                timeRange={series.range()}
                format="%M:%S"
                timeAxisTickCount={5}
                width={window.innerWidth < 600 ? window.innerWidth * 0.8 : window.innerWidth * 0.4}
              >
                <ChartRow
                  height={300}
                >
                  <YAxis
                    id="price"
                    label="Micro-Strain ( μ E )"
                    min={series.min()}
                    max={series.max()}
                    // width="60"
                    format=",.2f"
                  />
                  <Charts>
                    <LineChart axis="price" series={series} style={style} />
                    <Baseline
                      axis="price"
                      style={baselineStyleLite}
                      value={series.max()}
                      label="Max"
                      position="right"
                    />
                    <Baseline
                      axis="price"
                      style={baselineStyleLite}
                      value={series.min()}
                      label="Min"
                      position="right"
                    />
                    <Baseline
                      axis="price"
                      style={baselineStyleExtraLite}
                      value={series.avg() - series.stdev()}
                    />
                    <Baseline
                      axis="price"
                      style={baselineStyleExtraLite}
                      value={series.avg() + series.stdev()}
                    />
                    <Baseline
                      axis="price"
                      style={baselineStyle}
                      value={series.avg()}
                      label="Avg"
                      position="right"
                    />
                  </Charts>
                </ChartRow>
              </ChartContainer>


            </div>



          </div>
          <div
            style={{ color: "white", fontSize: 20, marginLeft: 20, }}
          >
            Set Strain gague factor
          </div>
          <Grid container>
            <Grid item xs={7}>
              {/* input */}
              <input
                onChange={onChangeFactor}
                type="number"
                placeholder="Insert strain gague factor"
                style={{
                  marginTop: 10,
                  height: 30,
                  width: '80%',
                }}
              />
            </Grid>
            <Grid item xs={5}>
              <div
                onClick={() => setgaguefactor(factor)}
                className="hover_button"
                style={{
                  color: "white",
                  backgroundColor: "#99B898",
                  borderRadius: 5,
                  padding: 5,
                  fontSize: 20,
                  margin: 10,
                  cursor: "pointer"
                }}>
                Set
              </div>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} sm={6}>
          <div
            style={{
              padding: 20,
            }}
          >
            <div
              style={{ fontSize: 20, marginTop: 10, marginBottom: 10, }}
            >
              Microstrain
            </div>

            <div style={{ fontSize: 40, margin: 20, marginTop: 10, color: "#2A363B", backgroundColor: "white", borderRadius: 5 }}>
              {(2 * 10 ** 6 * (points.slice(-1)[0][1] - zerovalue) / (gaguefactor * refVolt)).toFixed(2)}
            </div>

            <Grid container style={{ marginTop: 20 }}>
              <Grid item xs={12} spacing={3}>
                <div
                  onClick={() => {
                    setzerovalue(points.slice(-1)[0][1])
                    // zerovalue = points.slice(-1)[0][1] / gaguefactor;
                    console.log('points.slice(-1)[0][1] : ', points.slice(-1)[0][1]);
                  }}

                  className="hover_button"
                  style={{
                    color: "white",
                    backgroundColor: "#abab00",
                    borderRadius: 5,
                    padding: 5,
                    fontSize: "Clamp(15px,3.6vw,30px)",
                    marginLeft: 20,
                    marginRight: 20,
                    cursor: "pointer"
                  }}>
                  Set Zero
                </div>
              </Grid>

              <Grid item xs={4} spacing={3}>
                <div
                  onClick={() => {
                    setpoints([[new Date, 0]]);
                    mqttSub(mqttsubconfig);
                  }}

                  className="hover_button"
                  style={{
                    color: "white",
                    backgroundColor: "#99B898",
                    borderRadius: 5,
                    padding: 10,
                    fontSize: "Clamp(15px,3.6vw,30px)",
                    margin: 20,
                    cursor: "pointer"
                  }}>
                  Start
                </div>
              </Grid>
              <Grid item xs={4}>
                <div
                  onClick={() => mqttUnSub(mqttsubconfig)}
                  className="hover_button"
                  style={{
                    color: "white",
                    backgroundColor: "#FF847C",
                    borderRadius: 5,
                    padding: 10,
                    fontSize: "Clamp(15px,3.6vw,30px)",
                    margin: 20,
                    cursor: "pointer"
                  }}>
                  Stop
                </div>
              </Grid>
              <Grid item xs={4}>
                <div
                  onClick={() => {
                    setpoints([[new Date, 0]])
                  }
                  }
                  className="hover_button"
                  style={{
                    color: "white",
                    backgroundColor: "#666666",
                    borderRadius: 5,
                    padding: 10,
                    fontSize: "Clamp(15px,3.6vw,30px)",
                    margin: 20,
                    cursor: "pointer"
                  }}>
                  Clear
                </div>
              </Grid>

              <Grid item xs={12}>
                <div
                  style={{
                    borderRadius: 5,
                    background: 'white',
                    textAlign: "center",
                    color: "#2A363B",
                    margin: 20,
                    padding: 5,
                  }}
                >
                  Gague factor = {gaguefactor}
                </div>
              </Grid>
              <Grid item xs={12}>
                {/* table */}
                <Table
                  downloadTable={true}
                  tableRowStyle={
                    { height: 10 }
                  }
                  list={
                    points.map(
                      each => ({
                        sensor_value: (each[1] - zerovalue).toFixed(4),
                        time: ((each[0] - points[0][0]) / 1000).toFixed(4),
                        strain: (2 * 10 ** 6 * (each[1] - zerovalue) / (gaguefactor * refVolt)).toFixed(4),
                      })
                    )
                  } //array object
                  pageCount={10} //no of rows to be showed per page.
                  headers={[{
                    headerName: 'Time(s)',
                    mapKey: 'time'
                  },
                  {
                    headerName: 'Sensor Value (mV)',
                    mapKey: 'sensor_value'
                  },
                  {
                    headerName: 'Microstrain (μE)',
                    mapKey: 'strain'
                  },

                  ]}
                //table header
                />
              </Grid>
            </Grid>
          </div>
        </Grid >
      </Grid >
      <div style={{
        // position: "absolute",
        // bottom: 0,
        // right: 0,
        padding: 10,
      }}>
        @ Design by Chula ME Student 2021
      </div>
    </div >
  );
}

export default App;
