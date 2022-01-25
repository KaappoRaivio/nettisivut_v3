module.exports = config => {
  const db = require("../config/db")(config);

  return {
    getBlogposts: async () => {
      const posts = await (await db).all("SELECT * FROM blogposts");
      return posts.map(post => ({
        ...post,
        cleanTitle: post.slug,
      }));
    },

    getBlogpost: async id => {
      const post = await (await db).get("SELECT * FROM blogposts WHERE id = ?", id);
      return {
        ...post,
      };
    },
  };
};
