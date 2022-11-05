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

在看源码之前希望能先使用一遍这里能理解的更加透彻
