
import dotenv from "dotenv";
dotenv.config();


import express from "express";
import customerApi from "./routes/customers.js";
import authApi from "./routes/auth.js";
import productApi from "./routes/products.js";
import invoicesApi from "./routes/invoices.js";
import paymentsApi from "./routes/payments.js";
import roleApi from "./routes/roles.js";
import userApi from "./routes/users.js";
import createLinkApi from "./routes/createLink.js";

import cors from 'cors';

const app = express();

app.use(cors({ origin: "*", methods: "GET,POST" }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use("/fpm/api/customers", customerApi);
app.use("/fpm/api/auth", authApi);
app.use("/fpm/api/products", productApi);
app.use("/fpm/api/invoices", invoicesApi);
app.use("/fpm/api/payments", paymentsApi);
app.use("/fpm/api/roles", roleApi);
app.use("/fpm/api/users", userApi);
app.use("/fpm/api/pay", createLinkApi);
// console.log('DB_USER:', process.env.DB_USER);

app.listen("5000", () => console.log("Welcome to FPM"));
