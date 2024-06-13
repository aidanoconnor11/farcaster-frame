import { serve } from '@hono/node-server'
import * as fs from 'fs'
import { Hono } from 'hono'
import { html } from 'hono/html'
import type { FrameSignaturePacket } from './types'

// Define a function to load data from a JSON file
function loadDataFromFile(filename: string): Record<string, any> {
  try {
    const data = fs.readFileSync(filename, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading data:', error)
    return {}
  }
}

// Define a function to save data to a JSON file
function saveDataToFile(filename: string, data: Record<string, any>): void {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8')
    console.log('Data saved successfully.')
  } catch (error) {
    console.error('Error saving data:', error)
  }
}

const app = new Hono()

//Initial Frame State
app.get('/', async (c) => {
  //Using placeholder dynamic image generators to display text
  const frameImage = `https://placehold.jp/100/000000/ffffff/1920x1005.png?text=There+will+be+over+10,000+Kramer+predictions+before+6/29+midnight` // Specify PNG format
  const framePostUrl = c.req.url

  return c.html(html`
    <html lang="en">
      <head>
        <meta property="og:image" content="${frameImage}" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${frameImage}" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <meta property="fc:frame:post_url" content="${framePostUrl}" />
        <meta property="fc:frame:button:1" content="Yes" />
        <meta property="fc:frame:button:2" content="No" />
        <title>Farcaster Frames</title>
      </head>
      <body>
        <h1>Hello Farcaster!</h1>
      </body>
    </html>
  `)
})

//Determining if the user clicked "positions" after voting
let firstClick = true

//Frame State After Clicking
app.post('/', async (c) => {
  try {
    //User data we use for logic
    const body = await c.req.json<FrameSignaturePacket>()
    const { buttonIndex, fid } = body.untrustedData

    //Data storage file name
    const filename = 'id_data.json'
    const data = loadDataFromFile(filename)

    // If 'votes' field doesn't exist, create it
    if (!data.votes) {
      data.votes = { yes: 0, no: 0 }
    }

    // If 'users' array doesn't exist, create it
    if (!data.users) {
      data.users = []
    }

    //Determines if the user has voted or not
    var users = data.users
    let userFound = false
    let userVote = null
    for (let i = 0; i < users.length; i++) {
      if (users[i].id === fid) {
        userFound = true
        userVote = users[i].vote
        break
      }
    }

    //If the user already voted and clicked view positions, this displays the positions
    if (firstClick === false) {
      const frameImage = `https://placehold.jp/100/000000/ffffff/1920x1005.png?text=The+Challenge+Was:+There+will+be+over+10,000+Kramer+predictions+before+6/29+midnight.+The+results+are+${data.votes.yes}+yes+votes+and+${data.votes.no}+no+votes.` // Specify PNG format
      const framePostUrl = c.req.url

      return c.html(html`
        <html lang="en">
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${frameImage}" />
            <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
            <meta property="fc:frame:post_url" content="${framePostUrl}" />
            <meta
              property="fc:frame:button:1"
              content="Follow Kramer For Updates"
            />
            <meta name="fc:frame:button:1:action" content="link" />
            <meta
              name="fc:frame:button:1:target"
              content="https://warpcast.com/~/channel/kramer"
            />
            <title>Farcaster Frames</title>
          </head>
        </html>
      `)
    }

    //Tells the user they have already voted
    if (userFound === true) {
      const frameImage = `https://placehold.jp/100/000000/ffffff/1920x1005.png?text=You+already+voted+"${userVote}",+don't+you+remember?` // Specify PNG format
      const framePostUrl = c.req.url
      firstClick = false

      return c.html(html`
        <html lang="en">
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${frameImage}" />
            <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
            <meta property="fc:frame:post_url" content="${framePostUrl}" />
            <meta
              property="fc:frame:button:1"
              content="Follow Kramer For Updates"
            />
            <meta name="fc:frame:button:1:action" content="link" />
            <meta
              name="fc:frame:button:1:target"
              content="https://warpcast.com/~/channel/kramer"
            />
            <meta property="fc:frame:button:2" content="View positions" />
            <title>Farcaster Frames</title>
          </head>
        </html>
      `)
    }

    //Adds the users votes to the vote count
    var voted = ''
    if (buttonIndex === 1) {
      data.votes.yes += 1
      voted = 'Yes'
    } else {
      data.votes.no += 1
      voted = 'No'
    }

    const frameImage = `https://placehold.jp/100/000000/ffffff/1920x1005.png?text=The+Challenge+Was:+There+will+be+over+10,000+Kramer+predictions+before+6/29+midnight.+The+results+are+${data.votes.yes}+yes+votes+and+${data.votes.no}+no+votes.` // Specify PNG format
    const framePostUrl = c.req.url

    //Adds the new user to the data storage
    data.users.push({ id: fid, vote: voted })

    saveDataToFile(filename, data)

    return c.html(html`
      <html lang="en">
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${frameImage}" />
          <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          <meta property="fc:frame:post_url" content="${framePostUrl}" />
          <meta
            property="fc:frame:button:1"
            content="Follow Kramer For Updates"
          />
          <meta name="fc:frame:button:1:action" content="link" />
          <meta
            name="fc:frame:button:1:target"
            content="https://warpcast.com/~/channel/kramer"
          />
          <title>Farcaster Frames</title>
        </head>
      </html>
    `)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Invalid request' }, 400)
  }
})

const port = process.env.PORT || 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
