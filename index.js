const express = require("express");
const app = express();
const cors = require("cors");
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const PORT = process.env.PORT || 3000;
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();


// here mongodb - protocol,
// localhost:27017 - IP address & Port,
// todo_app -db name as mongo db creates db name dynamically 
// const url = "mongodb://localhost:27017"
const url = process.env.DB;

// to ignore CORS error
app.use(cors({
    origin: "*"
}))

app.use(express.json())

function authenticate(req, res, next) {
    try {
        // check if the token is present, 
        // if present then check if it is valid
        if (req.headers.authorization) {
            jwt.verify(req.headers.authorization, process.env.JWT_SECRET, function (error, decoded) {
                if (error) {
                    console.log(error)
                    res.status(401).json({
                        message: "Unauthorized"
                    })
                } else {
                    req.userid = decoded.id
                    next()
                }
            })
        } else {
            res.status(401).json({
                message: "No Token Present"
            })
        }
    } catch (error) {
        console.error();
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

// ***************** Node part with db ********************

// Each and every time while conneting to the db, 
// follow below steps:
// 1.Initiate the connection
// 2.Select the DB
// 3.Select the collection
// 4.Perform Operation
// 5.Close the connection


app.post("/register", async function (req, res) {
    try {

        // Initiate the connection
        let client = await mongoClient.connect(url)

        // Connect the db
        let db = client.db("todo_app");

        // Hashing the password
        let salt = bcryptjs.genSaltSync(10);
        let hash = bcryptjs.hashSync(req.body.password, salt);
        req.body.password = hash;

        // select collections and perform operation
        let data = await db.collection("users").insertOne(req.body)

        // close the connection
        await client.close();

        res.json({
            message: "User Created",
            id: data._id
        })
    }
    catch (error) {
        console.error();
    }
})

app.post("/login", async function (req, res) {
    try {
        // Intiate the connection
        let client = await mongoClient.connect(url)

        // select the db
        let db = client.db("todo_app");

        // find the user with the email id 
        let user = await db.collection("users").findOne({ userName: req.body.userName })
        // console.log(user);
        if (user) {
            // hash the incoming password
            // compare the hash password with the users password
            // which is in the database and
            let matchPassword = bcryptjs.compareSync(req.body.password, user.password);
            if (matchPassword) {
                // Generate JWT Token
                let token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
                console.log(token)
                res.json({
                    message: true,
                    token
                })
            } else {
                res.status(404).json({
                    message: "Username/Password incorrect"
                })
            }
        } else {
            res.status(404).json({
                message: "Username/Password incorrect"
            })
        }

        // if both are correct then allow access

    } catch (error) {
        console.error();
    }
})

app.get("/list-all-todo", [authenticate], async function (req, res) {
    try {

        // Initiate the connection
        let client = await mongoClient.connect(url)

        // select the db
        let db = client.db("todo_app")

        // select the collection and perform operation
        let data = await db.collection("task").find({userid : req.userid}).toArray();

        // close connection
        await client.close();

        res.json(data);

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong"
        })
    }
})

app.post("/create-task", [authenticate], async function (req, res) {
    try {
        // Connect the db / initiate the connection
        let client = await mongoClient.connect(url);

        // Select the db
        let db = client.db("todo_app")

        // slect the collection and perfom the action
        req.body.userid = req.userid;
        let data = await db.collection("task").insertOne(req.body)

        // close the connection
        await client.close();

        res.json({
            message: "task created"
        })
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong"
        })
    }
})


app.put("/update-task/:id", [authenticate], async function (req, res) {
    try {
        // Connect the db / initiate the connection
        let client = await mongoClient.connect(url);

        // Select the db
        let db = client.db("todo_app")

        // slect the collection and perfom the action
        let data = await db.collection("task")
            .findOneAndUpdate({ _id: mongodb.ObjectId(req.params.id) }, { $set: req.body });

        // close the connection
        await client.close();

        res.json({
            message: "Task updated"
        })
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong"
        })
    }
})

app.delete("/delete-task/:id", [authenticate], async function (req, res) {
    try {
        // Connect the db / initiate the connection
        let client = await mongoClient.connect(url);

        // Select the db
        let db = client.db("todo_app")

        // slect the collection and perfom the action
        let data = await db.collection("task")
            .findOneAndDelete({ _id: mongodb.ObjectId(req.params.id) });

        // close the connection
        await client.close();

        res.json({
            message: "Task Deleted"
        })
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong"
        })
    }
})

app.get("/dashboard", [authenticate], async function (req, res) {
    res.json({
        message: "Protected Data"
    })
})


app.listen(PORT, function () {
    console.log(`This app is listening to port ${PORT}`);
})



// *************** Node Part without db **************** 


// *****middleware added*****
// whenever a req comes in, the data sending in from the post
// method will be stored in the body data and it will be very
// difficult to extract the data so we use this middleware  
// provided by express and store it req.body 

// =>app.use(express.json())

// we dont need this variable as we are storing the data in db

// => let task = []

// to send the data to Client

// => app.get("/list-all-todo", function (req, res) {
//     res.json(task)
// })

// to receive the data from client
// => app.post("/create-task", function (req, res) {
//     req.body.id = task.length + 1;
//     req.body.date = new Date();
//     req.body.status = false;
//     task.push(req.body)
//     res.json({
//         message: "Task created successfully"
//     })
// })

// => app.put("/update-task/:id", function (req, res) {
//     let selectTask = task.findIndex((obj) => obj.id == req.params.id);
//     // console.log(selectTask);
//     if (selectTask != -1) {
//         task[selectTask].status = req.body.status
//         res.json({
//             message: "Task updated"
//         })
//     }
//     else {
//         res.status(400).json({
//             message: "No task found"
//         })
//     }
// })

// => app.delete("/delete-task/:id", function (req, res) {
//     let selectTask = task.findIndex((obj) => obj.id == req.params.id);
//     if (selectTask != 1) {
//         task.splice(selectTask, 1);
//         res.json({
//             message: "deleted successfully"
//         })
//     }
//     else {
//         res.status(400).json({
//             message: "No task found"
//         })
//     }
// })

// => app.listen(3000, function () {
//     console.log("this app is listening to port 3000")
// })