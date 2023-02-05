//importing
require('dotenv').config()
const express =require("express");
const mongoose =require("mongoose");
const Pusher=require("pusher");
const cors=require("cors"); 
import Messages from "./dbMessages.js";
import Pusher from "pusher";

//app config
const app = express();

const port = process.env.PORT || 9000;
const connection_url ="mongodb+srv://User2:zU5l4yY91S50mSbv@cluster0.jvnnob1.mongodb.net/?retryWrites=true&w=majority";

const pusher = new Pusher({
  appId: "1548143",
  key: "2d032d72406beaa3b0cf",
  secret: "591d8ed050b44b00f982",
  cluster: "ap2",
  useTLS: true,
});

//middleware

app.use(express.json());
app.use(cors());

//DB config


mongoose.connect(connection_url, {
  useNewUrlParser: true,
});
const db = mongoose.connection;
db.once("open", () => {
  console.log("DB connected");
  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();
  changeStream.on("change", (change) => {
    console.log("A change occured", change);
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp:messageDetails.timestamp,
        received:messageDetails.received
      });
    } else {
      console.log("Error triggering pusher");
    }
  });
});

//api routes
app.get("/", (req, res) => res.status(200).send("hello world"));
app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});
app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});
//listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));
