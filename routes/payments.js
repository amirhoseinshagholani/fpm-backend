import express from "express";
import jwt, { decode } from 'jsonwebtoken';
import mysql from 'mysql2';
import dotenv from 'dotenv';

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

router.post('/getCustomersInvoicesTotalPayment', async (req, res) => {
    if (!req.headers["authorization"]) {
        res.json({
            success: false,
            data: "Token is required",
        });
        return false;
    }
    if (!req.body.accounting_code) {
        res.json({
            success: false,
            message: "کد حسابداری ضروری است"
        })
        return false;
    }

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const accounting_code = req.body.accounting_code;

    jwt.verify(token, secretKey, (err, result) => {
        conn.query(`select IFNULL(sum(amount),0)as total_payments from payments WHERE customer_accounting_code=${accounting_code} and status='2'`, (err, result) => {
            if (err) {
                res.json({
                    success: false,
                    message: err
                });
                return false;
            }
            res.json({
                success: true,
                data: result
            })
        })
    });
});

router.get('/getInvoicesTotalPayment', async (req, res) => {
    if (!req.headers["authorization"]) {
        res.json({
            success: false,
            data: "Token is required",
        });
        return false;
    }

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    jwt.verify(token, secretKey, (err, result) => {
        conn.query(`select IFNULL(sum(amount),0)as total_payments from payments WHERE status='2'`, (err, result) => {
            if (err) {
                res.json({
                    success: false,
                    message: err
                });
                return false;
            }
            res.json({
                success: true,
                data: result
            })
        })
    });
});

router.post('/getCustomersInvoicesPayment', async (req, res) => {
    if (!req.headers["authorization"]) {
        res.json({
            success: false,
            data: "Token is required",
        });
        return false;
    }
    if (!req.body.accounting_code) {
        res.json({
            success: false,
            message: "کد حسابداری ضروری است"
        })
        return false;
    }

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const accounting_code = req.body.accounting_code;

    if (accounting_code == "00") {
        jwt.verify(token, secretKey, (err, result2) => {
            conn.query(`select * from payments`, (err, result) => {
                if (err) {
                    res.json({
                        success: false,
                        message: err
                    });
                    return false;
                }
                res.json({
                    success: true,
                    data: result
                })
            })
        });
    } else {
        jwt.verify(token, secretKey, (err, result2) => {
            conn.query(`select * from payments WHERE customer_accounting_code=${accounting_code}`, (err, result) => {
                if (err) {
                    res.json({
                        success: false,
                        message: err
                    });
                    return false;
                }
                res.json({
                    success: true,
                    data: result
                })
            })
        });
    }

});

router.get('/getCountPayments', async (req, res) => {
    if (!req.headers["authorization"]) {
        res.json({
            success: false,
            data: "Token is required",
        });
        return false;
    }

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    jwt.verify(token, secretKey, (err, result) => {
        conn.query(`select count(*) from invoices`, (err, result) => {
            if (err) {
                res.json({
                    success: false,
                    message: err
                });
                return false;
            }
            res.json({
                success: true,
                data: result
            })
        })
    });
});


export default router;