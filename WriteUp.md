# Write-up

> This is the skeleton - replace everything in blockquotes with your own words
> and delete the prompts as you go. Aim for **~300 words** across the four
> questions; the route reference below can be as long as it needs to be.
>
> Write it like you're handing the work to a teammate. We'd rather read an
> honest "I ran out of time on X and here's what I'd do" than a polished list of
> accomplishments. **Submit this even if you didn't finish** - see CHALLENGE.md.

UNFORMATTED IDEATION/PLANNING: https://docs.google.com/document/d/1hx8s_anzgU9Lm21hllqRBOhq7lVH4uW_zhOSk0JLTp8/edit?usp=sharing

## 1. What did you build for Part B, and why that?

For Part B, I built a more accessible UI and the ability to add restaurants. I wanted the site to be accessible, aware, and usable. 

On the accessible end, I added aria-labels for text-to-speech readers and images so the user can better remember the restaurant they visited.

On the awareness end, I added tags for each restaurant (local, minority-owned, women-owned, etc.) so that upon repeat visits, the user could pick a place they wanted to support (such as supporting local). If I had more time, I would have loved to make a search and filter using names and tags, as well as collections based on these tags.

Finally, on the usability end, I wanted some way for the user to interact with the site. I first added URLs (I just have example URLs currently) so that the user could visit the restaurant's website or Google Maps page. Next, I added the ability to add a restaurant to allow the user to expand upon the current data.

I chose these features to make the site more accessibility concious and usable, regardless of the intent or capability of the user. Whenever I design and develop a web-based product, I put these principles first before everything.

> What made you pick it over everything else you could have built? This is the
> question we care most about - the _why_ matters more than the _what_.

## 2. What did you decide, and what did you rule out?

I decided on expanding the data model to include website_url, image_url, and tags; I believed the current restaurant component was not descriptive enough, and needed something more to make it more memorable. This included adding images and external links to the restaurant. Additionally, I wanted to add X-owned tags to ensure that the user could be concious of what restaurants they were supporting and understand more about where they eat.

However, I ruled out the search and filter system. To me, the site currently feels incomplete, especially with the addition of tags. A search and filter system would have made complete sense given a better way to group restaurants and the prospect of this list growing to new lengths.

(couldn't pass up adding brennen though...)

> Route shapes, data model, where the logic lives, what you deliberately didn't
> do. Name a tradeoff you're not sure you got right.

## 3. Where did you cut corners?

In any case, I believe in human-first work. However, given the time constraint, and for full transparency, I turned to AI for a lot of this take-home. I completed Part A myself (it was mostly familiar), but used AI for a lot of Part B. A lot of it I understand and implemented using a Plan feature, but I still always prefer to complete the work myself and with integrity. With more time, I would have made these designs in Figma myself, worked closer with the data, and implemented everything myself. I am not against AI at all, I just believe that we should try our best to create authentic work.

Additionally, in future iterations I would have pulled live data from restaurants instead of using placeholder images and URLs.

> What would you fix first with another day?

---

## Part B: routes

I added a GET /api/tags endpoint to allow the user to dynamically fetch and select tags, most of which were pre-populated by me.

I also changed the request/response shapes to include website_url, image_url, and tags.

> Every endpoint you added, with its request and response shapes, so we can
> exercise it without reverse-engineering your code. Add or remove rows as
> needed; delete this section if your Part B added no routes.

| Method and path | What it does | Success | Errors       |
| --------------- | ------------ | ------- | ------------ |
| `GET /api/...`  |              | `200` + | `404` if ... |
| `POST /api/...` |              | `201` + | `400` on ... |

**`POST /api/...`**

```jsonc
// request
{ "name": "string (required, max 120 chars)",
  "cuisine": "string or null (max 80 chars)",
  "address": "string or null (max 200 chars)",
  "rating": "number 1-5 or null",
  "website_url": "http(s) URL or null (max 2048 chars)",
  "image_url": "http(s) URL or null (max 2048 chars)",
  "tagSlugs": ["string array of tag slugs"]
}

// 201 response
{"id": "number",
  "name": "string",
  "cuisine": "string or null",
  "address": "string or null",
  "rating": "number 1-5 or null",
  "website_url": "string or null",
  "image_url": "string or null",
  "createdAt": "ISO date string",
  "tags": [{ "id": "number", "slug": "string", "label": "string" }]
}
```

## Schema changes

I added website_url (TEXT) and image_url (TEXT) to the restaurants table, while also creating a tags table pre-populated with 6 tags. The restaurant_tags table links the two using foreign keys.

> Any migrations you added (`002_*.sql`, ...), new tables or columns, and
> anything a reviewer needs to run beyond `./setup.sh`. Write "none" if there
> were none.

## How I verified this

I mainly used the curl verification checks on CHALLENGE.md and read the responses. Thankfully, my HTTP status codes were the same as the API checklist. This included disallowing ratings outside of 0-5, wrong IDs, and not receiving a name upon creation.

> How you checked your work - the happy paths _and_ the failures. `curl`
> commands, a Postman collection, a scratch script, screenshots: whatever you
> actually used. Paste the commands.
>
> This is much faster for us to review than working it out ourselves, and it's
> how you show you checked the edge cases.

**Part A** - the contract table in CHALLENGE.md, every row including the error
cases:

```bash
# e.g.
curl -i http://localhost:3000/api/restaurants          # 200 + array
curl -i http://localhost:3000/api/restaurants/99999    # 404
curl -i http://localhost:3000/api/restaurants/abc      # 404
curl -i -X POST http://localhost:3000/api/restaurants \
  -H 'Content-Type: application/json' \
  -d '{"name":"Out Of Range","rating":6}'              # 400
```

**Part B** - the equivalent cases for what you built:

```bash
curl -i http://localhost:3000/api/restaurants #GET all restaurants
#POST a new restaurant
curl -i -X POST http://localhost:3000/api/restaurants \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Local Bistro",
    "cuisine": "French",
    "address": "123 Main St",
    "rating": 4,
    "website_url": "https://example.com",
    "image_url": "https://example.com/image.jpg",
    "tagSlugs": ["local", "womens-owned"]
  }'

curl -i http://localhost:3000/api/restaurants/1 #GET a restaurant with tags
curl -i -X DELETE http://localhost:3000/api/restaurants/1 #DELETE a restaurant

curl -i -X POST http://localhost:3000/api/restaurants \
  -H 'Content-Type: application/json' \
  -d '{"name":""}' #no name edge case

curl -i http://localhost:3000/api/restaurants/99999 # restaurant out of range edge case

curl -i http://localhost:3000/api/tags #GET tags list

```

## Known issues / what I'd do next

I would add a search and filter system, as I believe this application can get clunky as more restaurants are added. This would also make good use of the restaurant tags.

Additionally, I would create curated collections of X-owned restaurants so that the user can conciously choose restaurants to support, and explore beyond restaurants they have already gone to.

> Anything broken, unfinished, or that you know is wrong. Being upfront here
> costs you nothing and tells us a lot.
