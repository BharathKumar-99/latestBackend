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
app.post('/adminregister', function (request, response) {
    console.log(request.body)

    var name = request.body.name;
    var email = request.body.email;
    var password = request.body.password;
    var phone = request.body.phone;

    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("Admins");
        var myobj = {
            "name": name,
            "email": email,
            "password": password,
            "phone": phone,
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
            "venders": [],


        };
        dbo.collection("Admin_List").findOne({ email: request.body.email }, function (err, user) {
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
                dbo.collection("Admin_List").insertOne(myobj, function (err, res) {
                    if (err) throw err;
                    console.log("Registration Successful!");
                    response.json({
                        "message": "Registration Successful!",
                        "name": name,
                        "id": myobj._id
                    })
                    db.close();
                });
            }
        });

        db.db("Admins").collection("Admin_List").find({ "status": "pending" })
        .toArray( function (err,res) { 
          if(err) console.log(err);
          if(res!=null)
          
              socket.emit("kycadmin",JSON.stringify(res));
              else
              console.log("error");
      });
      
      db.db("Admins").collection("Admin_List").find({ "status": "approved" })
      .toArray( function (err,res) { 
        if(err) console.log(err);
        if(res!=null)
        
            socket.emit("aprovedadmin",JSON.stringify(res));
            else
            console.log("error");
      });
    });

   

});


//panfront upload
function panfrontupload(req, id) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldpath = files.pan_front.filepath;
        var newpath = "/var/www/jmexhibition.com/html/uploads/" + id + "_pan_front.jpg";
        fs.copyFile(oldpath, newpath, function (err) {
            if (err) {
                throw err;
            } else {
                console.log("Uploaded!");
            }
            return newpath;

        });
    });
}
//panback upload
function ProfilePic(req, id) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldpath = files.profile_pic.filepath;
        console.log(oldpath);
        var newpath = "/var/www/jmexhibition.com/html/uploads/profilepic/" + id + "profilepic.jpg";
        fs.rename(oldpath, newpath, function (err) {
            if (err) {
                throw err;
            }
            else {
                console.log("Uploaded!pic");
            }
            return newpath;
        });
    });
}

//addharfront upload
function addharfrontupload(req, id) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldpath = files.aadhar_front.filepath;
        var newpath = "/var/www/jmexhibition.com/html/uploads/" + id + "_aadhar_front.jpg";
        fs.rename(oldpath, newpath, function (err) {
            if (err) {
                throw err;
            }
            else {
                addharfrontdone = true;
            }
            return newpath;
        });
    });
}

//addharback upload
function addharbackupload(req, id) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldpath = files.aadhar_back.filepath;
        var newpath = "/var/www/jmexhibition.com/html/uploads/" + id + "_aadhar_back.jpg";
        fs.rename(oldpath, newpath, function (err) {
            if (err) {
                throw err;
            }
            else {
                addharbackdone = true;
            }
            return newpath;
        });
    });
}

//upload documents
app.post('/adminuploadDocument', function (request, response) {

    
    var pan_front_id = crypto.randomBytes(20).toString('hex');
    var profilepicid = crypto.randomBytes(20).toString('hex');
    var aadhar_front_id = crypto.randomBytes(20).toString('hex');
    var aadhar_back_id = crypto.randomBytes(20).toString('hex');

    ProfilePic(request, profilepicid);
    panfrontupload(request, pan_front_id);
    addharbackupload(request, aadhar_back_id);
    addharfrontupload(request, aadhar_front_id);

    var pan_front = "http://167.235.73.87:8080/uploads/" + pan_front_id + "_pan_front.jpg";
    var profile_pic = "http://167.235.73.87:8080/uploads/profilepic/" + profilepicid + "profilepic.jpg";
    var aadhar_front = "http://167.235.73.87:8080/uploads/" + aadhar_front_id + "_aadhar_front.jpg";
    var aadhar_back = "http://167.235.73.87:8080/uploads/" + aadhar_back_id + "_aadhar_back.jpg";

    var res = {
        "message": "Documents Uploaded Successfully",
        "pan_front": pan_front,
        "profile_pic": profile_pic,
        "aadhar_front": aadhar_front,
        "aadhar_back": aadhar_back
    }

    response.send(JSON.stringify(res));

});


//update documents monogoDB
async function upsertListingByName(client, nameOfListing, updatedListing) {
    console.log(nameOfListing)
    const result = await client.collection("Admin_List")
        .updateOne({ email: nameOfListing },
            { $set: updatedListing },
            { upsert: true });
    console.log(`${result.matchedCount} document(s) matched the query criteria.`);

    if (result.upsertedCount > 0) {
        console.log(`One document was inserted with the id ${result.upsertedId._id}`);
    } else {
        console.log(`${result.modifiedCount} document(s) was/were updated.`);
    }

}

//update documents
app.post('/adminupdatedocuments', function (request, response) {
    console.log(request.body)
    var email = request.body.email;
    var pan_front = request.body.pan_front;
    var profile_pic = request.body.profile_pic;
    var aadhar_front = request.body.aadhar_front;
    var aadhar_back = request.body.aadhar_back;

    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("Admins");
        var myobj = {
            "pan_front": pan_front,
            "profile_pic": profile_pic,
            "aadhar_front": aadhar_front,
            "aadhar_back": aadhar_back
        };

        upsertListingByName(dbo, email, myobj);

    });
});



app.post('/adminlogin', function (request, response) {
    console.log(request.body)
    var email = request.body.email;
    var password = request.body.password;
    MongoClient.connect(url, function (err, db) {
        if (err) {
            throw err;
        }

        var dbo = db.db("Admins");
        dbo.collection("Admin_List").find({
            email: email, password: password
        }).
            toArray(function (err, result) {
                if (err) throw err;
                if (result.length == 0) {
                    response.send("Invalid Email or Password");
                }
                else {

                    if (result[0].aadhar_back == "" && result[0].pan_front == "") {
                        response.send(
                            "Document upload Pending",

                        );
                    } else {
                        response.send(JSON.stringify(result[0]));
                    }

                }
            });
    });
});





app.get('/getapproadmin', function (req, res) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            throw err;
        }
        var dbo = db.db("Admins");
        dbo.collection("Admin_List").find({ "status": "approved" }).toArray(function (err, result) {
            if (err) throw err;
            res.json(result);
            db.close();
        });
    });
});

app.get('/getverifadmin', function (req, res) {
    console.log("verify");
    MongoClient.connect(url, function (err, db) {
        if (err) {
            throw err;
        }
        var dbo = db.db("Admins");
        dbo.collection("Admin_List").find({ "status": "pending" })
            .toArray(function (err, result) {
                if (err) throw err;
                res.json(result);
                db.close();
            });
    });

});

//get stocks
app.post('/admindailystock', function (request, response) {
    console.log("dailystock")
    var email = request.body.email;
    MongoClient.connect(url, function (err, db) {
        if (err) {
            throw err;
        }
        var dbo = db.db("Admins");
        dbo.collection("Admin_List").find({
            email: email
        }).
            toArray(function (err, result) {
                if (err) throw err;
                if (result.length == 0) {
                    response.send("Something Went Wrong");
                }
                else {

                    response.send(JSON.stringify(result[0]));
                }
            });
    });
});

app.post('/getadminsorders', function (req, res) {
    var email = req.body.email;
    MongoClient.connect(url, function (err, db) {
        if (err) {
            throw err;
        }
        var dbo = db.db("Admins");
        dbo.collection("Admin_List").find({ "email": email })
            .toArray(function (err, result) {
                if (err) throw err;
                res.json(result);
                db.close();
            });
    });
})

app.post('/statuschangeadmin', function (req, res) {
    var email = req.body.email;

    if (req.body.status) {

        MongoClient.connect(url, function (err, db) {
            if (err) {
                throw err;
            }
            result = db.db("Admins");
            result.collection("Admin_List").updateOne(
                { "email": email }, {
                "$set": { "active": false }
            }, function (err, res) {
                if (err) throw err;


                db.close();
            });
            if (result.upsertedCount > 0) {
                console.log(`One document was inserted with the id ${result.upsertedId._id}`);
            } else {
                console.log(`${result.modifiedCount} document(s) was/were updated.`);
                res.send("Updated");
            }


        });
    }
    else {
        MongoClient.connect(url, function (err, db) {
            if (err) {
                throw err;
            }
            result = db.db("Admins");
            result.collection("Admin_List").updateOne(
                { "email": email }, {
                "$set": { "active": true }
            }, function (err, res) {
                if (err) throw err;


                db.close();
            });
            if (result.upsertedCount > 0) {
                console.log(`One document was inserted with the id ${result.upsertedId._id}`);
            } else {
                console.log(`${result.modifiedCount} document(s) was/were updated.`);
                res.send("Updated");
            }


        });
    }

});

app.post('/acceptadmin', function (req, res) {
    var email = req.body.email;

    MongoClient.connect(url, function (err, db) {
        if (err) {
            throw err;
        }
        result = db.db("Admins");
        result.collection("Admin_List").updateOne(
            { "email": email }, {
            "$set": { "status": "approved" }
        }, function (err, res) {
            if (err) throw err;


            db.close();
        });
        if (result.upsertedCount > 0) {
            console.log(`One document was inserted with the id ${result.upsertedId._id}`);
        } else {
            console.log(`${result.modifiedCount} document(s) was/were updated.`);
            res.send("Updated");
        }


 

});
});

app.post('/rejectadmin', function (req, res) {
    var email = req.body.email;

    MongoClient.connect(url, function (err, db) {
        if (err) {
            throw err;
        }
        result = db.db("Admins");
        result.collection("Admin_List").deleteOne(
            { "email": email }, function (err, res) {
                if (err) throw err;


                db.close();
            });
        if (result.upsertedCount > 0) {
            console.log(`One document was inserted with the id ${result.upsertedId._id}`);
        } else {
            console.log(`${result.modifiedCount} document(s) was/were updated.`);
            res.send("Updated");
        }
        db.db("Admins").collection("Admin_List").find({ "status": "pending" })
        .toArray( function (err,res) { 
          if(err) console.log(err);
          if(res!=null)
          
              socket.emit("kycadmin",JSON.stringify(res));
              else
              console.log("error");
      });
      
      db.db("Admins").collection("Admin_List").find({ "status": "approved" })
      .toArray( function (err,res) { 
        if(err) console.log(err);
        if(res!=null)
        
            socket.emit("aprovedadmin",JSON.stringify(res));
            else
            console.log("error");
      });

    });
    

});


app.get('/getprofile',function(req,res){

    var email = req.body.email;
    MongoClient.connect(url, function (err, db) {
        if (err) {
            throw err;
        }
        var dbo = db.db("Admins");
        dbo.collection("Admin_List").find({ "email": email })
            .toArray(function (err, result) {
                if (err) throw err;
                res.json(result);
                db.close();
            });
    });

});

module.exports = app;