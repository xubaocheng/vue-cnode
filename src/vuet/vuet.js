import Vue from 'vue'
import Vuet from 'vuet'

Vue.use(Vuet)

const API = 'https://cnodejs.org/api/v1'

export default new Vuet({
  pathJoin: '-',
  modules: {
    topic: {
      list: {
        data () {
          return {
            data: [], // 列表存储的数据
            loading: true, // 数据正在加载中
            done: false, // 数据是否已经全部加载完成
            page: 1 // 加载的页数
          }
        },
        async fetch ({ state, route, params, path }) {
          // 注，在vuet 0.1.2以上版本，会多带一个params.routeWatch参数，我们可以根据这个来判断页面是否发生了变化
          if (params.routeWatch === true) { // 路由发生了变化，重置模块状态
            this.reset(path)
          } else if (params.routeWatch === false) { // 路由没有变化触发的请求，可能是从详情返回到列表
            return {}
          }
          // params.routeWatch 没有参数，则是上拉加载触发的调用
          const { tab = '' } = route.query
          const res = await fetch(`${API}/topics/?mdrender=false&limit=20&page=${state.page}&tab=${tab}`).then(response => response.json())
          const data = params.routeWatch ? res.data : [...state.data, ...res.data]
          return {
            data,
            page: ++state.page,
            loading: false,
            done: res.data.length < 20
          }
        }
      },
      detail: {
        data () {
          return {
            data: {
              id: null,
              author_id: null,
              tab: null,
              content: null,
              title: null,
              last_reply_at: null,
              good: false,
              top: false,
              reply_count: 0,
              visit_count: 0,
              create_at: null,
              author: {
                loginname: null,
                avatar_url: null
              },
              replies: [],
              is_collect: false
            },
            existence: true,
            loading: true,
            commentId: null
          }
        },
        async fetch ({ route }) {
          const { data } = await fetch(`${API}/topic/${route.params.vid}`).then(response => response.json())
          if (data) {
            return {
              data,
              loading: false
            }
          }
          return {
            existence: false,
            loading: false
          }
        }
      }
    },
    user: {
      self: {
        data () {
          return {
            data: JSON.parse(localStorage.getItem('vue_cnode_self')) || {
              avatar_url: null,
              id: null,
              loginname: null,
              success: false
            }
          }
        },
        manuals: {
          async login ({ state }, accesstoken) {
            const res = await fetch(`${API}/accesstoken`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: `accesstoken=${accesstoken}`
            }).then(response => response.json())
            if (typeof res === 'object' && res.success) {
              state.data = res
              localStorage.setItem('vue_cnode_self', JSON.stringify(res))
              localStorage.setItem('vue_cnode_accesstoken', accesstoken)
            }
            return res
          },
          signout () {
            localStorage.removeItem('vue_cnode_self')
            localStorage.removeItem('vue_cnode_accesstoken')
            this.reset()
          }
        }
      },
      detail: {
        data () {
          return {
            data: {
              loginname: null,
              avatar_url: null,
              githubUsername: null,
              create_at: null,
              score: 0,
              recent_topics: [],
              recent_replies: []
            },
            existence: true,
            loading: true,
            tabIndex: 0
          }
        },
        async fetch ({ route }) {
          const { data } = await fetch(`${API}/user/${route.params.username}`).then(response => response.json())
          if (data) {
            return {
              data,
              loading: false
            }
          }
          return {
            existence: false,
            loading: false
          }
        }
      },
      messages: {
        data () {
          return {
            data: {
              has_read_messages: [],
              hasnot_read_messages: []
            },
            loading: true
          }
        },
        async fetch () {
          const accesstoken = localStorage.getItem('vue_cnode_accesstoken')
          if (!accesstoken) return
          const { data } = await fetch(`${API}/messages?mdrender=true&accesstoken=${accesstoken}`).then(response => response.json())
          return {
            data
          }
        }
      }
    }
  }
})
