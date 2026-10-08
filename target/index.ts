import express from "express";



const app = express();


app.get("/", (_req, res) => {
    res.send("Load test target is working!");
});


app.listen(5000, () => {
    console.log("Load test target is running on port 3000");
});