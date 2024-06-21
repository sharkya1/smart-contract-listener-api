import cors from 'cors'
import dotenv from 'dotenv'
import { ethers } from 'ethers'
import express, { Request, Response } from 'express'
import sqlite3 from 'sqlite3'

dotenv.config()

const port = process.env.PORT || 3000
const providerUrl = process.env.RPC_PROVIDER_URL!
const address = process.env.CONTRACT_ADDRESS || ''
const abi = process.env.CONTRACT_ABI ? JSON.parse(process.env.CONTRACT_ABI) : []

// Create DB
const db = new sqlite3.Database('database.db')
db.run("CREATE TABLE IF NOT EXISTS mints (id INTEGER PRIMARY KEY, toAddress TEXT NOT NULL, block BIGINT, date TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")

const ethProvider = new ethers.JsonRpcProvider(providerUrl)
const contract = new ethers.Contract(address, abi, ethProvider)

// Listen for contract 'Transfer' event
contract.on('Transfer', async (_from, to, _value, event) => {
    try {
        // Ignore burns
        if(to !== '0x0000000000000000000000000000000000000000'){
            const block = event.log.blockNumber
            await insertMint(to, block)
            console.log(`Insert Success | Block ${block} | To ${to}`)
        }
    } catch (err) {
        console.error('Error inserting mint:', err)
    }
})

async function insertMint(to: string, block: number): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO mints (toAddress, block) VALUES (?, ?)", [to, block], (err) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

async function getRecentMints(): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM mints ORDER BY id DESC LIMIT 5`
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err)
            }
            else {
                return resolve(rows)
            }
        })
    })
}

const api = express()
api.use(cors())
api.use(express.json())

// Mints API Endpoint
api.get('/mints', async (_req: Request, res: Response) => {
    try {
        const mintData = await getRecentMints()
        res.json(mintData)
    } catch (err) {
        console.error('Error fetching mints:', err)
        res.status(500).json({ error: 'Failed to fetch mints' })
    }
})

api.listen(port, () => {
    console.log(`API Running at http://localhost:${port}`)
})
