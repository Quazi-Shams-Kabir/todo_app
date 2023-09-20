import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

var homeItems = [];
var workItems = [];

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// for the first time there will be no newItem as items is not initiated at all, but it'll not crash as
// in ejs, locals.newItem will check for it, and no fallback is added if it not found, no it simply stays same

// after getting redirected here again from the post method, it now contain newItem, and send it to ejs file and gets displayed

app.get("/", (req, res) => {
  const fullDate = new Date().toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  // sending page variable to later identify on which page user is on and route accordingly
  res.render("index.ejs", {
    date: fullDate,
    newItem: homeItems,
    page: "today",
  });
});

app.get("/work", (req, res) => {
  res.render("index.ejs", {
    workItem: workItems,
    page: "work",
  });
});

// redirected instead of render solves :
// 1. not adding the last element again, as refreshing it redirected to the homepage itself, not post route, so items dont get added here,
// 2. respective pages(get route) reflect changes, not only post route

app.post("/", (req, res) => {
  homeItems.push(req.body["newItem"]);
  res.redirect("/");
});

app.post("/work", (req, res) => {
  workItems.push(req.body["newItem"]);
  res.redirect("/work");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
