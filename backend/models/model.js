module.exports = config => {
  const db = require("../config/db")(config);

  return {
    getBlogposts: async () => {
      const posts = await (await db).all("SELECT * FROM blogposts");
      return posts.map(post => ({
        ...post,
        previewText: "Not available",
        cleanTitle: post.slug,
      }));
    },

    getBlogpost: async id => {
      return await (await db).get("SELECT * FROM blogposts WHERE id = ?", id);
    },
  };
};
