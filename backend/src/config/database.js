const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    // Allow Sequelize sync to drop/recreate tables without FK errors
    foreignKeys: false,
  },
  hooks: {
    afterConnect: async (connection) => {
      await connection.run('PRAGMA foreign_keys = OFF;');
    },
  },
});

module.exports = { sequelize };
