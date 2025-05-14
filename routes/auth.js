import express from "express";
import mysql from "mysql2";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();
const router = express.Router();

const secretKey = process.env.JWT_SECRET;
const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})
conn.connect();

router.post("/login", (req, res) => {

    const username = req.body.username;
    const password = req.body.password;
    const isRemember = req.body.isRemember;
    const isUser = req.body.isUser;
    var token = '';

    if (!username) {
        res.json({
            "success": false,
            "message": "username is required"
        })
        return false;
    }
    if (!password) {
        res.json({
            "success": false,
            "message": "password is required"
        })
        return false;
    }

    try {
        if (isUser) {
            const user = conn.query("SELECT * FROM users WHERE username=? AND password=?",[username,password], (err, result) => {
                if (err) {
                    res.json({
                        "success": false,
                        "message": err
                    })
                    return false;
                }

                if (result?.length) {
                    token = jwt.sign({id:result[0].id,username:result[0].username},secretKey,{
                        expiresIn:"24h"
                    })
                    if(token){
                        res.json({
                            "success":true,
                            "type":"user",
                            "result":token
                        })
                    }else{
                        res.json({
                            "success":false,
                            "result":"احراز هویت با مشکل مواجه شده است، لطفا مجددا تلاش کنید"
                        })
                    }
                } else {
                    res.json({
                        "success": false,
                        "message": "نام کاربری یا رمز عبور اشتباه است"
                    })
                }
            });
        }else{
            const customer = conn.query("SELECT * FROM customers_user_pass WHERE username=? AND password=?",[username,password], (err, result) => {
                if (err) {
                    res.json({
                        "success": false,
                        "message": err
                    })
                    return false;
                }

                if (result?.length) {
                    token = jwt.sign({id:result[0].id,username:result[0].username},secretKey,{
                        expiresIn:"24h"
                    })
                    if(token){
                        res.json({
                            "success":true,
                            "type":"customer",
                            "result":token
                        })
                    }else{
                        res.json({
                            "success":false,
                            "result":"احراز هویت با مشکل مواجه شده است، لطفا مجددا تلاش کنید"
                        })
                    }
                } else {
                    res.json({
                        "success": false,
                        "message": "نام کاربری یا رمز عبور اشتباه است"
                    })
                }
            });
        }
    } catch (err) {

    }

});

export default router;