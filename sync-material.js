import { createClient } from '@supabase/supabase-js'
import { Octokit } from '@octokit/rest'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const OWNER = process.env.GITHUB_OWNER
const REPO = process.env.GITHUB_REPO

// 初始化客户端，使用GH_TOKEN
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const octokit = new Octokit({ auth: process.env.GH_TOKEN })

async function syncImagesToDB() {
  // 获取images文件夹全部文件
  const { data: fileList } = await octokit.rest.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path: "images",
    ref: "main"
  })

  // 只过滤图片格式
  const imgFiles = fileList.filter(file => {
    const ext = file.name.split('.').pop().toLowerCase()
    return ['png', 'jpg', 'jpeg', 'svg'].includes(ext)
  })

  console.log(`检测图片总数：${imgFiles.length}`)

  // 批量写入数据库，已有素材保留价格
  for (const file of imgFiles) {
    const fileName = file.name
    const { error } = await supabase
      .from('logo_material')
      .upsert(
        { file_name: fileName },
        { onConflict: 'file_name', ignoreDuplicates: false }
      )

    if (error) {
      console.error(`同步失败 ${fileName}：`, error.message)
    } else {
      console.log(`同步成功：${fileName}`)
    }
  }
  console.log('✅ 全部素材同步完成')
}

syncImagesToDB()
