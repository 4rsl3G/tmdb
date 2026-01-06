const { DataTypes } = require("sequelize");
const { sequelize } = require("./sequelize");

const Setting = sequelize.define("Setting", {
  key: { type: DataTypes.STRING, primaryKey: true },
  value: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: "settings", timestamps: false });

const Post = sequelize.define("Post", {
  tmdb_id: { type: DataTypes.INTEGER, unique: true },

  title: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },

  excerpt: { type: DataTypes.TEXT },
  content: { type: DataTypes.TEXT, allowNull: false },

  meta_title: { type: DataTypes.TEXT },
  meta_desc: { type: DataTypes.TEXT },

  status: { type: DataTypes.STRING, allowNull: false, defaultValue: "published" },

  poster_url: { type: DataTypes.TEXT },
  backdrop_url: { type: DataTypes.TEXT },

  release_date: { type: DataTypes.STRING },
  release_year: { type: DataTypes.STRING },
  runtime: { type: DataTypes.INTEGER },

  genres_json: { type: DataTypes.TEXT },
  vote_average: { type: DataTypes.FLOAT },
  vote_count: { type: DataTypes.INTEGER },

  director: { type: DataTypes.STRING },
  cast_json: { type: DataTypes.TEXT },

  trailer_key: { type: DataTypes.STRING },
  providers_json: { type: DataTypes.TEXT }
}, { tableName: "posts", timestamps: true });

module.exports = { Setting, Post };
