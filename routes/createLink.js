import express from "express";
import dotenv from "dotenv";
import mysql from 'mysql2';
import axios from "axios";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getToday } from "../assets/functions.js";

dotenv.config();
const router = express.Router();
const secretKey = process.env.JWT_SECRET;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})
conn.connect();

async function sendSMS(to, text) {
  const data = {
    username: process.env.FARAPAYAMAK_USERNAME || "",
    password: process.env.FARAPAYAMAK_PASSWORD || "",
    to,
    from: process.env.FARAPAYAMAK_NUMBER || "",
    text,
    isflash: false
  };

  try {
    const response = await axios.post(
      "https://rest.payamak-panel.com/api/SendSMS/SendSMS",
      data
    );
    console.log(response);
    return response.data;
  } catch (error) {
    console.error("SMS sending error:", error.response?.data || error.message);
    throw error;
  }
}



// const rsaPublicKey = fs.readFileSync(
//   path.resolve(path.join(__dirname, "../config/0049818597.txt")),
//   "utf-8"
// );

// function generateRandomHexBytes(byteLength) {
//   return crypto.randomBytes(byteLength).toString("hex");
// }

// function createDigitalEnvelope({ amount, terminalCode, passPhrase }) {
//   const aesKey = generateRandomHexBytes(32);
//   const iv = generateRandomHexBytes(16);

//   const zeroPadAmount = amount.toString().padStart(12, "0");
//   const inputStr = `${terminalCode}${passPhrase}${zeroPadAmount}00`;
//   console.log({ inputStr });

//   const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(aesKey, "hex"), Buffer.from(iv, "hex"));
//   let encrypted = cipher.update(inputStr, "utf8", "base64");
//   encrypted += cipher.final("base64");

//   const encryptedKey = crypto.publicEncrypt(
//     {
//       key: rsaPublicKey,
//       padding: crypto.constants.RSA_PKCS1_PADDING,
//     },
//     Buffer.from(aesKey, "hex")
//   ).toString("base64");

//   return {
//     data: encrypted,
//     iv,
//     encryptedKey,
//   };
// }

// async function requestPaymentToken({ amount, redirectAddress }) {
//   const invoiceNumber = Math.floor(Math.random() * 1e10).toString();
//   const terminalId = "08175424"; // 8 رقمی
//   const acceptorId = "992180008175424"; // 15 رقمی
//   const passPhrase = "0D7566C195C8B5B9";
//   const requestTimestamp = Math.floor(Date.now() / 1000);

//   const envelope = createDigitalEnvelope({ amount, terminalCode: terminalId, passPhrase });
//   console.log("📦 Digital Envelope:", envelope);

//   const payload = {
//     authenticationEnvelope: {
//       data: envelope.data,
//       iv: envelope.iv,
//       encryptedKey: envelope.encryptedKey,
//     },
//     request: {
//       terminalId,
//       acceptorId,
//       amount,
//       transactionType: "Purchase",
//       requestId: invoiceNumber,
//       requestTimestamp,
//       revertUri: redirectAddress || "https://api.nekatel.com/nekatel/api/getway/revert"
//     }
//   };

//   try {
//     const { data } = await axios.post("https://ikc.shaparak.ir/api/v3/tokenization/make", payload, {
//       headers: { "Content-Type": "application/json" },
//     });

//     console.log("📨 Response:", data);

//     if (data.responseCode === "00") {
//       return { success: true, token: data.result.token };
//     } else {
//       return { success: false, message: data.description || "Token generation failed" };
//     }
//   } catch (error) {
//     console.error("❌ Token Request Error:", error.response?.data || error.message);
//     return { success: false, message: error.response?.data || error.message };
//   }
// }

router.post("/sendLink", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.json({ success: false, message: "Token is required" });
  }

  const link = req.body.link;
  // const link = "test";
  // const tracking_code = req.body.tracking_code;

  if (!link) {
    return res.json({ success: false, message: "Link is required" });
  }

  jwt.verify(token, secretKey, async (err, result) => {
    if (err) return res.json({ success: false, message: err });

    const { accounting_code } = result;
    if (!accounting_code) return res.json({ success: false, message: "accounting_code is required" });

    const { name, username, mobile, amount, description, tracking_code } = req.body || {};
    if (!name || !username || !mobile || !amount || !tracking_code) {
      return res.json({ success: false, message: "نام مشتری، نام کاربری، شماره موبایل، کد پیگیری و مبلغ الزامی هستند" });
    }
    let customerName = "";
    try {
      const selectQuery = "select * from customers where accounting_code=?";
      const value = [accounting_code];
      conn.query(selectQuery, value, async (err, results) => {
        if (err) {
          return res.json({ success: false, message: "خطا در دریافت اطلاعات" });
        }
        if (results.length === 0) {
          return res.json({ success: false, message: "مشتری پیدا نشد" });
        }

        customerName = results[0].title;
        customerName = customerName.replace(/ي/g, 'ی').replace(/ك/g, 'ک');
        customerName = customerName.replace(/^(جناب\s*آقای|سرکار\s*خانم|آق[ایي]|خانم)\s*/u, '');
        customerName = customerName.replace(/\s*\(.*?\)\s*/g, '');
        customerName = customerName.trim();
      });
    } catch (err) {
      return res.json({ success: false, message: "خطای سرور" });
    }

    const today = getToday();
    const insertQuery = `INSERT INTO payments 
      (refer_to, customer_accounting_code, token, url_payment,tracking_code, consumer_mobile, consumer_name, amount, status, description, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?)`;

    const values = [username, accounting_code, '', link, tracking_code, mobile, name, amount, '0', description, today, today];

    try {
      conn.query(insertQuery, values, async (err) => {
        if (err) {
          console.error(err);
          return res.json({ success: false, message: "خطا در ثبت در دیتابیس" });
        }

        // const message = `${name} عزیز\nباسلام. مبلغ قابل پرداخت برای شما ${amount} ریال می‌باشد.\nلینک پرداخت:\n ${link}\nبهین کارا درمان`;
        const message = `${name} عزیز\nباسلام. مبلغ قابل پرداخت برای شما ${amount} ریال می‌باشد.\nلینک پرداخت:\n ${link}\n${customerName}`;
        try {
          await sendSMS(mobile, message);
          res.json({
            success: true,
            message: `لینک پرداخت با موفقیت ثبت و ارسال شد`,
            link: link
          });
        } catch (smsErr) {
          res.json({
            success: true,
            message: `لینک پرداخت ثبت شد اما پیامک ارسال نشد`,
            link: link
          });
        }
      });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: `ارسال لینک انجام نشد، لطفا مجدد امتحان کنید` });
    }
  });
});






export default router;
