//https://github.com/xivapi/xivapi-js
const XIVAPI = require('@xivapi/js')
const xiv = new XIVAPI()

const getItemID = async (item) => {
  //find item
  let res = await xiv.search(item)

  //return item ID
  return res.Results[0].ID
}

const getFCMembers = async (name, world) => {
  //find the FC with its name and server
  let res = await xiv.freecompany.search(name, { server: world })

  //get the FC ID
  let id = res.Results[0].ID

  //get and return fc members
  let fc = await xiv.freecompany.get(id, { data: FCM })
  return fc.FreeCompanyMembers
}

const getChar = async (name, family, server) => {
  //find the character with their name and server
  let res = await xiv.character.search(`${name} ${family}`, { server: server }) //case insensitive server names, btw ;)

  //get the character
  let char = res.Results[0]

  //return whether or not the character's lodestone bio matches our token
  return char.Bio
}
module.exports = {
  category: 'lodestone',
  description: 'query lodestone', // Required for slash commands
  slash: true, // Create both a slash and legacy command
  testOnly: true,
  options: [
    //character
    {
      //get character profiles from @xivapi/js
      name: "character",
      type: 1,
      description: "search a character on lodestone",
      options: [
        {
          name: "search",
          description: "search any character name on lodestone",
          type: 1,
          options: [
            {
              name: "world",
              description: "world of character",
              type: 3
            },
            {
              name: "name",
              description: "name of character",
              type: 3
            },
            {
              name: "family",
              description: "family name of character",
              type: 3
            }
          ]
        },
        {
          name: "user",
          description: "search any discord user on lodstone",
          type: 1,
          options: [
            {
                name: "member",
                type: 6,
                description: "search any discord user on lodstone"
            }
          ]
        }
      ]
    },
    //item
    {
        name: "item",
        type: 1,
        description: "search for an item by name",
        options: [
          {
            name: "name",
            description: "item name",
            type: 3,
            required: true
          }
        ]
    },
    //free company
    {
      name: "freecompany",
      type: 2,
      description: "search for a free company",
      options: [
        {
          name: "datacenter",
          description: "datacenter of free company",
          type: 3
        },
        {
          name: "world",
          description: "world of free company",
          type: 3
        },
        {
          name: "name",
          description: "name of free company",
          type: 3
        }
      ]
    }
  ],
  callback: ({ interaction }) => {
    const subcommand = interaction.options._subcommand
    console.log(subcommand)
  }
}
