const express = require("express");
const app = express();
const cors = require("cors");

// to ignore CORS error
app.use(cors({
    origin: "*"
}))

// *****middleware added*****
// whenever a req comes in, the data sending in from the post
// method will be stored in the body data and it will be very
// difficult to extract the data so we use this middleware  
// provided by express and store it req.body 
app.use(express.json())


let task = []

// to send the data to Client
app.get("/list-all-todo", function (req, res) {
    res.json(task)
})

// to receive the data from client
app.post("/create-task", function (req, res) {
    req.body.id = task.length + 1;
    req.body.date = new Date();
    req.body.status = false;
    task.push(req.body)
    res.json({
        message: "Task created successfully"
    })
})

app.put("/update-task/:id", function (req, res) {
    let selectTask = task.findIndex((obj) => obj.id == req.params.id);
    // console.log(selectTask);
    if (selectTask != -1) {
        task[selectTask].status = req.body.status
        res.json({
            message: "Task updated"
        })
    }
    else {
        res.status(400).json({
            message: "No task found"
        })
    }
})

app.delete("/delete-task/:id", function (req, res) {
    let selectTask = task.findIndex((obj) => obj.id == req.params.id);
    if (selectTask != 1) {
        task.splice(selectTask, 1);
        res.json({
            message: "deleted successfully"
        })
    }
    else {
        res.status(400).json({
            message: "No task found"
        })
    }
})

app.listen(3000, function () {
    console.log("this app is listening to port 3000")
})