import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";
import 'dotenv/config'

const app = express();
const port = 3000;
const fullDate = new Date().toLocaleString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// connecting mongoose with mongodb
mongoose.connect(`mongodb+srv://shamsKabir:${process.env.ATLAS_PASS}@todo-app.bjbepcd.mongodb.net/?retryWrites=true&w=majority`);

// simple schema for our items
const itemsSchema = new mongoose.Schema({
  name: String,
});

// custom schema if the user creates a new list
const customListSchema = new mongoose.Schema({
  name: String,
  newItems: [itemsSchema],
});

// creating Item model, for default route
const Item = mongoose.model("Item", itemsSchema);

// custom List model for custom routes
const List = mongoose.model("List", customListSchema);

// adding some default items
const item1 = new Item({
  name: "Welcome to your todo app",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

app.get("/", (req, res) => {
  Item.find({}).then((foundItems) => {
    // inserting defaultItems, if there are no items in the db
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems).then(() => {
        res.redirect("/");
      });
    } else {
      // render the page with those items after redirecting of if the db already contain items
      res.render("index.ejs", {
        pageTitle: fullDate,
        newItem: foundItems,
      });
    }
  });
});

// /favicon.ico, /robots.txt, /humans.txt, /sitemap.xml, /ads.txt: these are automatically routed by browser
// and will create new mongodb document, to prevent it, top level domain should be avoided(/:param)
// sub-level like /new/:param or need to manually handle all those but in future and other top level domain will also create the same problem

app.get("/new/:customList", (req, res) => {
  // using lodash captalize the first letter, it'll remove case-sensitivity of the listName
  // and retriving will be easy
  const customListName = _.capitalize(req.params.customList);

  List.findOne({ name: customListName }).then((foundList) => {
    if (!foundList) {
      const list = new List({
        name: customListName,
        newItems: defaultItems,
      });
      list.save().then(() => {
        res.redirect("/new/" + customListName);
      });
    } else {
      res.render("index.ejs", {
        pageTitle: foundList.name,
        newItem: foundList.newItems,
      });
    }
  });
});

app.get("/yourLists", (req, res) => {
  List.find({}).then((foundList) => {
    var listNames = [];
    foundList.forEach((list) => {
      listNames.push(list.name);
    });
    res.render("index.ejs", {
      pageTitle: "Your Lists",
      customItem: listNames,
    });
  });
});

app.post("/delete", (req, res) => {
  const id = req.body.checkbox;
  const title = req.body.title;

  // as the today or fulldate list is the home page, docs from here can be directly deleted
  // whereas customLists needed to be identified with its name, that'll go to else condition and search for that list
  if (title === fullDate) {
    Item.findByIdAndRemove(id).then(() => {
      res.redirect("/");
    });
  } else {
    // using mongodb $pull to remove item from the array of items (for loop or other methods can be used)
    List.findOneAndUpdate(
      { name: title },
      { $pull: { newItems: { _id: id } } }
    ).then(() => {
      List.findByIdAndRemove(id).then(() => {
        res.redirect("/new/" + title);
      });
    });
  }
});

app.post("/deleteList", (req, res) => {
  List.deleteOne({name:req.body.submit}).then(()=>{
    res.redirect("/yourLists");
  });
});

// inserting user entered item into db
app.post("/", (req, res) => {
  const itemName = req.body["newItem"];
  const title = req.body.button;

  const item = new Item({
    name: itemName,
  });

  if (title === fullDate) {
    item.save().then(() => {
      res.redirect("/");
    });
  } else if (title === "Your Lists") {
    res.redirect("/new/" + itemName);
  } else {
    List.findOne({ name: title }).then((foundList) => {
      foundList.newItems.push(item);
      foundList.save().then(() => {
        res.redirect("/new/" + title);
      });
    });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
