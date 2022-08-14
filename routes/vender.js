const express = require('express')
const bodyParser = require('body-parser')
var MongoClient = require('mongodb').MongoClient;
const app = express()
var formidable = require('formidable');
var fs = require('fs');
const path =require('path');
var cors = require('cors')
var crypto = require("crypto");
var url = "mongodb://localhost:27017";
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(cors({
    origin: "*"
}));



//register user
app.post('/createvendor', function (request, response) {
    var name = request.body.name;
    var email = request.body.email;
    var password = request.body.password;
    var phone = request.body.phone;

    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("Vendor");
        var myobj = {
            "name": name,
            "email": email,
            "password": password,
            "phone": phone,
            "assigned":"noone",
            "pan_front": "",
            "profile_pic": "",
            "aadhar_front": "",
            "aadhar_back": "",
            "status": "pending",
            "active": true,
            "productin": 0,
            "productout": 0,
            "products": [],
            "sold": [],
        };
        dbo.collection("Vendor_List").findOne({ email: request.body.email }, function (err, user) {
            if (err) {
                var err = new Error('Someyhing Went Wrong');
                err.status = 400;
                response.json({
                    "message": "somethingwent wrong",
                    err
                });
            }
            //if a user was found, that means the user's email matches the entered email
            if (user) {
                if (user && user.aadhar_back == "", user.aadhar_front == "") {
                    var err = new Error('Document upload Pending')
                    err.status = 369;

                    response.json({
                        "message": "Document upload Pending",
                        err
                    });
                } else {
                    var err = new Error('A user with that email has already registered. Please use a different email..')
                    err.status = 400;
                    response.json({
                        "message": "A user with that email has already registered. Please use a different email..",
                        err
                    });
                }


            }

            else {
                var id;
                dbo.collection("Vendor_List").insertOne(myobj, function (err, res) {
                    if (err) throw err;
                    console.log("Registration Successful!");
                    response.json({
                        "message": "Registration Successful!",
                        "name": name,
                        "id": myobj._id
                    })
                    
                });
            }
        });

       
    });

    vendorsrefresh();

});


app.post('/acceptvendor', function (req, res) {
    var email = req.body.email;

    MongoClient.connect(url, function (err, db) {
        if (err) {
            throw err;
        }
        result = db.db("Vendor");
        result.collection("Vendor_List").updateOne(
            { "email": email }, {
            "$set": { "status": "approved" }
        }, function (err, res) {
            if (err) throw err;  
        });
        if (result.upsertedCount > 0) {
            console.log(`One document was inserted with the id ${result.upsertedId._id}`);
        } else {
            console.log(`${result.modifiedCount} document(s) was/were updated.`);
            res.send("Updated");
        }
    
        vendorsrefresh();
});
});

app.post('/rejectvendor', function (req, res) {
    var email = req.body.email;

    MongoClient.connect(url, function (err, db) {
        if (err) {
            throw err;
        }
        result = db.db("Vendor");
        result.collection("Vendor_List").deleteOne(
            { "email": email }, function (err, res) {
                if (err) throw err;                
            });
        if (result.upsertedCount > 0) {
            console.log(`One document was inserted with the id ${result.upsertedId._id}`);
        } else {
            console.log(`${result.modifiedCount} document(s) was/were updated.`);
            res.send("Updated");
        }
        vendorsrefresh();
    });
    

});


function vendorsrefresh(){
    MongoClient.connect(url, function (err, db) {
        if (err) {
            throw err;
        }
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
}


module.exports = app;