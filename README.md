> 很早之前就想去看 history 由于种种原因(懒) 就没有去看，现在通读一遍发现其实并不难。促进我看代码的原因是 我要重新学习一遍 react-router 不知道它的原理 我就感觉很难受，用着也不舒服。

我画了一个结构流程图 它能大体的表现出 history 源码的结构

![](https://user-images.githubusercontent.com/63789659/199401967-1e542508-f073-43d4-8c6b-b5ed2861517e.png)

首先 history 有三个模式 分别是 `Browser`、`hash`、`memory` 这三种模式

这三种模式又分别对应着三个构造函数:

>1、createBrowserHistory
>
>2、createHashHistory
>
>3、createMemory

它们的共同点是都会返回一个 `history`对象它有以下方法

~~~js
history = {
  get action() {},
  get location() {},
  createHref,
  push,
  replace,
  go,
  back() {},
  forward() {},
  listen(listener) {},
  block(blocker) {};
};
~~~

`action` 将会返回操作的状态 比如 添加: `PUSH` 替换：`REPLACE`

location 返回的是 location 对象 但这里 location 并不是 你直接通过 window.location 获取的对象，history 对其做了一些微小的改变，这里看一下 history 对 location 做出了那些改变

1、添加 `key` 确保每一个 location 都是独一无二的 

> 值得一提的是这里 key 我猜是借鉴了 react 中的 key 因为它们的生成方式都是一样的 `Math.radom().toString(36).splice(2, 8) `

2、添加`index` 为了维护 location 在历史记录的正常顺序添加 index 进行索引 这里并没有添加进 location 对象中这个 index 维护在 history 实例中 

`createHref`、 `push`、`replace`、`go`、`back`、`forward`、功能函数主要进行对 url 进行改变

重点是 `listen` 和 `block`这两个监听函数，它们的原理是采用了发布订阅的模式
> 其实名字看起来很高大上但其实就是把订阅函数放在数组中然后再恰当时机下去遍历数组执行函数(鄙视😒)
~~~js
function createEvent(){
  let handlers = []
  return {
    get length(){
      return handlers.length()
    },
    push (fn) {
      handle.push(fn)
      return function () {
        handlers = handlers.filter((handler) => handler !== fn)
      }
    },  
    call (arg) {
      handlers.forEach((fn) => fn && fn(arg))
    }
  }
}
~~~

按照执行顺序先来看 `block` 函数 先看一下官方给出的[定义](https://github.com/remix-run/history/blob/dev/docs/api-reference.md#createbrowserhistory)

> Prevents changes to the history stack from happening. This is useful when you want to prevent the user navigating away from the current page, for example when they have some unsaved data on the current page.

大意是防止历史记录被修改，当用户从当前页面离开时就会触发这个 bolck 监听函数，从而抛出一些事件或者做出一些动作从而阻止 url 发生的改变或者响应

`listen` 再执行完(修改完 url)的时候就会去触发 监听函数 从而加载对应的组件

当你创建 history 对象的同时，也同时监听了 `popstate`事件，该事件的触发时机：当你去在历史记录中跳转url或者从去点击浏览器的前进后退的摁钮时就会触发此事件，但有一点不同的是如果页面是通过历史记录跳转但与此同时重新加载(重载)就不会触发 `popstate`事件

> popstate 事件的触发是通过浏览器的前进后退触发的也就是说在历史记录中 跳转就会触发 popstate 事件。
>
>  pushState() 和 replace() 是不会触发 popstate 事件。
>
>  还有一个就是在历史记录中跳转  // 1.html/a   ==> // 1.html/b 又去访问了其他源的 url 比如 [www.baidu.com](http://www.baidu.com/) 然后后退 这个时候由于页面是重新加载了一遍所以并不会触发 popstate 事件 这里有些绕  
>
> 参考： 
>
> 1. [https://developer.mozilla.org/zh-CN/docs/Web/API/History_API#popstate_%E4%BA%8B%E4%BB%B6](https://developer.mozilla.org/zh-CN/docs/Web/API/History_API#popstate_事件) 
>
> 2. https://developer.mozilla.org/zh-CN/docs/Web/API/Window/popstate_event举一个例子 当前 url 在 www.ccc.com  此时监听了 popstate 事件，使用 pushState() 跳转到 www.ccc.com/www 然后去访问 www.baidu.com 然后点击回退 此时页面在 `www.ccc.com/www` 按理说应该触发 popstate 事件的 但是这里页面被重新加载 所以并不会触发

还有前面说的三个构造函数，虽然大同小异但是还是值得大家去细细看一下，我这里就不介绍差异点了。

我阅读的[history源码有部分给了代码注释](https://github.com/xiaochengzi6/history/blob/main/history%E6%BA%90%E7%A0%81.ts)

当然你在看源码之前最后自己先使用一遍这里能理解的更加透彻

### block 
block 函数的执行顺序是在即将跳转 url 从而抛出一些事件或者做出一些动作从而阻止 url 发生的改变或者响应

这个函数主要是去监听事件 `beforeunload`
~~~js
 function block(blocker) {
      let unblock = blockers.push(blocker);

      if (blockers.length === 1) {
        // 当 blocker 监听器只有一个的时候添加 onbeforeunload 事件
        // 页面刷新时，页面关闭时都会触发这个事件 
        window.addEventListener('beforeunload', promptBeforeUnload);
      }

      return function () {
        // 返回一个函数，调用该函数可以直接去跳转到下一个url
        unblock();

        // Remove the beforeunload listener so the document may
        // still be salvageable in the pagehide event.
        // See https://html.spec.whatwg.org/#unloading-documents
        if (!blockers.length) {
          window.removeEventListener('beforeunload', promptBeforeUnload);
        }
      };
    }


function promptBeforeUnload(event: BeforeUnloadEvent) {
  // 取消事件的默认行为
  event.preventDefault();
  // Chrome (and legacy IE) requires returnValue to be set.
  event.returnValue = "";
}
~~~

调用 `history.block` 充当路由守卫的角色

参考：https://github.com/remix-run/history/blob/dev/docs/api-reference.md


### listen 监听函数

`history.listen` 函数开始监听位置变化，并在发生变化时使用Update调用给定的回调函数。

~~~js
// 存放 监听函数
const listeners = []

function listen(listener) {
  return listeners.push(listener);
},
~~~

调用监听函数会触发会保存在函数中，若存在 url 发生变化，代码去监听 `popstate` 事件

> popstate 事件只会在浏览器某些行为下触发，比如点击后退按钮（或者在 JavaScript 中调用 history.back() 方法）。即，在同一文档的两个历史记录条目之间导航会触发该事件。
>
> 参考：https://developer.mozilla.org/zh-CN/docs/Web/API/Window/popstate_event

在`Browser`模式下会使用 `createBrowserHistory`函数创建 `history` 函数改函数返回
~~~js
history = {
  get action() {},
  get location() {},
  createHref,
  push,
  replace,
  go,
  back() {},
  forward() {},
  listen(listener) {},
  block(blocker) {};
};
~~~
可以发现传入 url 去跳转的方法有两种 `push` 和 `replace` 

1. 使用 push 的核心原理就是调用了 `history.pushState()` 去创建的新历史条目相关联。每当用户导航到新的 state，都会触发 popstate 事件
~~~js
const globalHistory = window.history 
const nextAction = 'PUSH'

function push (to, state){
    let [historyState, url] = getHistoryStateAndUrl(nextLocation, index + 1);
    globalHistory.pushState(historyState, "", url);
    applyTx(nextAction);
}

function getHistoryStateAndUrl(
    nextLocation: Location,
    index: number
  ): [HistoryState, string] {
    return [
      {
        usr: nextLocation.state,
        key: nextLocation.key,
        idx: index,
      },
      createHref(nextLocation),
    ];
}
~~~

2. `replace(to, state?)`函数使用新的 url 替换历史堆栈中的消息，使用这个函数可以触发 `popState`事件
~~~js
const globalHistory = window.history 
const nextAction = 'REPLACE'
function replace(to, state?){
  let [historyState, url] = getHistoryStateAndUrl(nextLocation, index);

    // TODO: Support forced reloading
    globalHistory.replaceState(historyState, "", url);

    applyTx(nextAction);
}
~~~

~~~js
// 这里主要是将 action 标识和 loction 传入后调用所有监听函数
  function applyTx(nextAction: Action) {
    action = nextAction;
    [index, location] = getIndexAndLocation();

    // 开始调用所有的监听事件
    listeners.call({ action, location });
  }
~~~

`listeners` 为发布订阅模式，通过 `push` 来添加订阅 `call` 发布事件
~~~js
const listeners = new createEvents()

function createEvents(){
  let handles = []

  return {
    get length() {
      return handles.length
    },
   
   // push 方法
   push(fn){
      handles.push(fn)
      
      return function (){
        // 调用返回的函数后，会取消该监听函数
        handles = handles.filter((handle) => handle !== fn)
      }
    }

   // call 方法
   call(arg) {
     handles.forEach((fn) => fn && fn(arg))
   }
  }
}
~~~

### 总结
在使用 `push` 或 `replace`会触发 `popstate`事件，通过监听函数 `listen` 进行监听，也就说整个 history 的流程就是通过改变 `url` 在改变之前触发 `blocker` 监听函数 去做一些处理如：存储数据、拒绝跳转等，在`url`跳转之后开始调用 `listen`监听函数，触发监听函数可以让组件以此来进行更新。

`push` 和 `replace` 函数的原理是使用了 `window.history` 的 `pushState()` 和`replceState()`函数。使用者这两个函数改变 url 会发出`befounload`事件，从而让 block 监听函数调用，改变url后会触发 `popstate` 事件，监听到url 发生改变从而触发 `listen` 监听函数。



在看源码之前希望能先使用一遍这里能理解的更加透彻