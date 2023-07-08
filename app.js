//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ =require("lodash");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = {
  name: String,
};
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Welcome to Website"
});
const item2 = new Item({
  name: "Write & click to save your work"
});
const item3 = new Item({
  name: "Tick the checkbox to delete work"
});
const defaultItems = [item1, item2, item3];
const listSchema= {
  name:String,
  items:[itemsSchema]
}
const List = mongoose.model("List", listSchema);
app.get("/", function (req, res) {
  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            res.redirect("/");
          })
          .catch(function (err) {
            console.log(err);
            res.status(500).send("Failed to save default items to DB");
          });
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch(function (err) {
      console.log(err);
      res.status(500).send("Failed to retrieve items from DB");
    });
});


app.get("/:customListName",function(req,res){
  const customListName =_.capitalize(req.params.customListName);
  List.findOne({name: customListName})
  .then(function(foundList){
    if(!foundList){
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/"+customListName);
    } else{
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  })
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name:listName})
    .then(function(foundList){
      foundList.items.push(item);
      console.log("Saved in "+ listName);
      foundList.save();
      res.redirect("/"+listName);
    })
  }
});
app.post("/delete", function(req, res) {
  const checkIdDelete = req.body.checkbox;
  const listName =req.body.listName;
  if(listName === "Today"){
    
  Item.findByIdAndRemove(checkIdDelete)
  .then(function () {
    console.log("deleted frome home")
    res.redirect("/");
  })
  .catch(function (err) {
    console.log(err);
  })
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull:{items: {_id:checkIdDelete}}})
    .then(function(){
      console.log("Deleted in "+ listName);
      res.redirect("/"+ listName);
    })
  }
  });
app.listen(8000, function () {
  console.log("Server started on port 3000");
});
