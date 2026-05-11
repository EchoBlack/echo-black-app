import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));

app.get('/', (req,res)=>{
  res.sendFile('index.html',{root:'.'});
});

app.post('/api/generate-pack', async (req,res)=>{
  const {topic,mode,notes} = req.body;

  try{
    const response = await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'content-type':'application/json',
        'x-api-key':process.env.ANTHROPIC_API_KEY.trim(),
        'anthropic-version':'2023-06-01'
      },
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:2000,
        messages:[
          {
            role:'user',
            content:`
Generate an Echo Black ${mode} for:
${topic}

Include:
- titles
- hooks
- graphics_prompts
- broll_ideas
- shot_list
- research_checklist

Optional notes:
${notes}
`
          }
        ]
      })
    });

    const data = await response.json();

    const text = data.content?.[0]?.text || '{}';

    let payload = {};

    try{
      payload = JSON.parse(text);
    }catch{
      payload = {
        raw:text
      };
    }

    res.json({
      topic,
      mode,
      payload
    });

  }catch(err){
    res.status(500).json({
      error:err.message
    });
  }
});

app.listen(port,()=>{
  console.log('Echo Black running');
});