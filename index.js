const express = require("express");
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017";

var http=require("http");
var cors = require('cors');
const multer = require("multer");
const app =express();
const port=5000;
var server = http.createServer(app);

app.use("/admin", require("./routes/createadmin"));
app.use("/vendor", require("./routes/vender"));

var io=require("socket.io")(server,{
  cors:{
      origin:"*",
  },
});

MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  console.log("Database created!");
});


app.use(express.json());
app.use(cors());
global.io = io;


io.on("connection",(socket)=>{
  
console.log("Connected");
  
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    db.db("Dashboard").collection("earning").find()
    .toArray( function (err,res) { 
      if(err) log(err);
      if(res!=null)
      
          socket.emit("data",JSON.stringify(res));
          else
          console.log("error");
  });
 
  
  db.db("Admins").collection("Admin_List").find({ "status": "pending" })
  .toArray( function (err,res) { 
    if(err) log(err);
    if(res!=null)
        socket.emit("kycadmin",JSON.stringify(res));
        else
        console.log("error");
});

db.db("Admins").collection("Admin_List").find({ "status": "approved" })
.toArray( function (err,res) { 
  if(err) log(err);
  if(res!=null)
  
      socket.emit("aprovedadmin",JSON.stringify(res));
      else
      console.log("error");
});

db.db("Vendor").collection("Vendor_List").find({ "status": "pending" })
.toArray( function (err,res) { 
  if(err) console.log(err);
  if(res!=null)
  
  io.emit("kycvendor",JSON.stringify(res));
      else
      console.log("error");
});

db.db("Vendor").collection("Vendor_List").find({ "status": "approved" })
.toArray( function (err,res) { 
if(err) console.log(err);
if(res!=null)

     io.emit("aprovedvendor",JSON.stringify(res));
    else
    console.log("error");
});

  });
 



});

server.listen(port,()=>{
  console.log("server started on 5000");
});







