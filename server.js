const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const http = require("http");
require("dotenv").config();
const WebSocket = require("ws");
const app = express();
const cookieParser = require("cookie-parser");

// connect to db
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB CONNECTION ERROR: ", err));

// app middlewares
//app.use(bodyParser.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cors()); // allows all origins

// routes attached with server
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/iqBank"));
app.use("/api", require("./routes/iqTest"));
app.use("/api", require("./routes/DashboardTest"));
app.use("/api", require("./routes/blog"));
app.use("/api", require("./routes/certificate"));
app.use("/api", require("./routes/dashboardData"));
app.use("/api", require("./routes/support"));
//app.use("/api", require("./routes/auth"));

const port = process.env.PORT || 5001;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`API is running on port ${port}`);
});

const server = http.createServer();
const io = require("socket.io")(server, {
  path: "/mywebsocket",
  cors: {
    credentials: true,
    origin: true,
  },
});

const visitors = new Map();
io.on("connection", (socket) => {
  console.log("a user connected");
  const cookie = socket.handshake.headers.cookie;

  socket.on("incrementVisitorCount", (value) => {
    if (value) {
      let setValue = visitors.get(value);

      if (!setValue) {
        setValue = new Set();
      }
      setValue.add(socket.id);
      visitors.set(value, setValue);
    }

    io.emit("visitorCount", visitors.size);
  });

  socket.on("disconnect", () => {
    const res = getCookie("randomNumberForVisitorCount", cookie);

    let mySet = visitors.get(res);

    if (mySet) mySet.delete(socket.id);

    if (mySet != undefined && mySet.size === 0) {
      visitors.delete(res);
    }

    io.emit("visitorCount", visitors.size);
  });
});
function getCookie(cName, fullCookie) {
  const name = cName + "=";
  const cDecoded = decodeURIComponent(fullCookie);
  const cArr = cDecoded.split("; ");
  let res;
  cArr.forEach((val) => {
    if (val.indexOf(name) === 0) res = val.substring(name.length);
  });
  return res;
}
// Start the HTTPS server
server.listen(8080, () => {
  console.log(`WebSocket server listening on port 8080`);
});
