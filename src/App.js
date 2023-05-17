import {createHashHistory, createBrowserHistory, createMemoryHistory} from 'history'
// const history = require('./history/umd/history.development')
// let h = history.createBrowserHistory();
function App() {
  // ----------------第一种情况--------------------
  // let h = createBrowserHistory();
  
  // console.log('h', h)

  // h.listen( ({location, action}) => {
  //   console.log('监听：', location, action)
  // })

  // // 阻塞导航离开当前页面
  // const unblock = h.BLOCK( tx => {
  //   console.log('tx:', tx)
  //   if(window.confirm('确认离开？')){
  //     unblock()

  //     // 尝试重新跳转
  //     tx.retry();
  //   }
  // })


  // ------------------第三种情况---------------------------
  let h = createMemoryHistory()
  console.log(h)


  const handleClick = () => {
    h.push("home", { some: "state" })
    console.log(h.history)
  }

  const handleHash = () => {
    h.replace("logged-in");
  }

  const handleDefault = () => {
    h.back();
  }
  return (
    <div>
      <p>测试</p>
      <button onClick={handleClick}>跳转</button>
      <button onClick={handleHash}>跳转</button>

      <button onClick={handleDefault}>后退</button>

    </div>
  );
}

export default App;
