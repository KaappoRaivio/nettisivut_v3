// const model = require("./models/model");
//
// const main = async () => {
//   console.log(await model.getBlogposts());
//   console.log(await model.getBlogpost(1));
// };
//
// main();

const app = require("./app");

app.listen(5000, "localhost", () => {
  console.log("Listening!");
});
