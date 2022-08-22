//========================Pause function========
function toggleStop() {
    const pars = new URLSearchParams({
      val:  document.getElementById('toggle-stop').checked ? '1' : '0'
    });
    
    fetch('/memelcd?' + pars )                // Do the request
    .then(response => response.text())    // Parse the response 
    .then(text => {                       // DO something with response
      console.log(text);
      document.getElementById('esp-response').innerHTML = text;
    });
  }
  
  document.getElementById('toggle-stop').addEventListener('change', toggleStop );
//==============================================

//=====================image grid===============
//   function myFunction(imgs) {
//   var expandImg = document.getElementById("expandedImg");
//   var imgText = document.getElementById("imgtext");
//   expandImg.src = imgs.src;
//   imgText.innerHTML = imgs.alt;
//   expandImg.parentElement.style.display = "block";
// }
//==============================================

// Expand or collapse the content according to current state
function expandCollapse() {
// Get the HTML element immediately following the button (content)
var content = this.nextElementSibling; 
if (content.style.maxHeight) 
content.style.maxHeight = null;
else 
content.style.maxHeight = content.scrollHeight + "px";
}

// Select all "+" HTML buttons in webpage and add a listener for each one
const btnList = document.querySelectorAll(".collapsible");
btnList.forEach(elem => {
elem.addEventListener("click", expandCollapse ); // Set callback function linked to the button click
});

// This listener will execute an "arrow" function once the page was fully loaded
document.addEventListener("DOMContentLoaded", () => {
console.log('Webpage is fully loaded');

// At first, get the default values for form input elements from ESP
fetch('/getDefault')
.then(response => response.json())  // Parse the server response
.then(jsonObj => {                     // Do something with parsed response
  console.log(jsonObj);
  document.getElementById('period').value = jsonObj.period;
});
});

  // This listener will prevent each form to reload page after submitting data
document.addEventListener("submit", (e) => {
const form = e.target;        // Store reference to form to make later code easier to read
fetch(form.action, {          // Send form data to server using the Fetch API
  method: form.method,
  body: new FormData(form),

})

.then(response => response.text())  // Parse the server response
.then(text => {                     // Do something with parsed response
  console.log(text);
  const resEl = document.getElementById(form.dataset.result).innerHTML= text;
});

e.preventDefault();                 // Prevent the default form submit wich reload page
});
  ////////////////////////////////////////////////////////////////////////////////////////////

//================================================fs===============================================
var tree, fsInfo;

function setLoading(e, t) {
t && console.log(t), document.getElementById("loading-msg").innerHTML = t || "", e ? document.getElementById("loading").classList.add("shown") : document.getElementById("loading").classList.remove("shown"), document.body.style.cursor = e ? "wait" : "default"
}

function readableSize(e) {
if (e < 1024) return e + " B";
for (var t = -1; t++, 1024 < (e /= 1024););
return e.toFixed(2) + [" KiB", " MiB", " GiB", " TiB", "PiB"][t]
}

function refreshStatus() {
document.getElementById("status").innerHTML = "(refreshing...)";
var n = new XMLHttpRequest;
n.onload = function() {
    var e, t;
    200 != n.status ? showHttpError(n) : (e = (fsInfo = JSON.parse(n.responseText)).type + " - ", fsInfo.isOk ? (e += "<meter id='fsMeter' min='0' optimum='0'low='90' high='95' max='100' value='" + (1 + Math.round(99 * fsInfo.usedBytes / fsInfo.totalBytes)) + "' title='" + (t = readableSize(fsInfo.totalBytes - fsInfo.usedBytes) + " free of " + readableSize(fsInfo.totalBytes)) + "'>" + t + "</meter>", fsInfo.unsupportedFiles && (e += " <span id='warning'>WARNING<span class='tooltip'>Filesystem&nbsp;contains&nbsp;unsupported&nbsp;filenames:<br/>" + fsInfo.unsupportedFiles + "</span></span>")) : e += "<span style='background-color:red;color:white;font-weight:bold'>INIT ERROR !</span>", document.getElementById("status").innerHTML = e, "SPIFFS" != fsInfo.type && (document.getElementById("mkdir").style.display = "inline"))
}, n.open("GET", "/status", !0), n.send(null)
}

function showHttpError(e) {
alert("ERROR: [" + e.status + "] " + e.responseText)
}

function canLoadNewContents() {
return !!document.getElementById("saveBtn").disabled || !!confirm("Changes to your document will be lost if you continue") && (enableSaveDiscardBtns(!1), !0)
}

function enableSaveDiscardBtns(e) {
document.getElementById("saveBtn").disabled = !e, document.getElementById("discardBtn").disabled = !e
}

function getParentFolder(e) {
return (e = (e = e.startsWith("/") ? e : "/" + e).endsWith("/") ? e.slice(0, -1) : e).substring(0, e.lastIndexOf("/"))
}

function createHeader(e, n, t) {
var o = document.getElementById(e),
    a = document.createElement("input");
a.type = "file", a.multiple = !1, a.name = "data", o.appendChild(a);
var d = document.createElement("input");
d.id = "pathInput", d.type = "text", d.name = "path", d.defaultValue = "/", o.appendChild(d);
var l = document.createElement("button");
l.innerHTML = "Upload", o.appendChild(l);
var s = document.createElement("button");
//s.id = "mkdir", s.style.display = "none", s.innerHTML = "MkDir", o.appendChild(s);
var i = document.createElement("button");
//i.innerHTML = "MkFile", o.appendChild(i);
var c = document.createElement("span");
c.id = "editorButtons", c.style.display = "none", o.appendChild(c);
var r = document.createElement("button");
r.id = "saveBtn", r.innerHTML = "Save", r.style.marginLeft = "30px", r.disabled = !0, c.appendChild(r);
var m = document.createElement("button");
m.id = "discardBtn", m.innerHTML = "Discard", m.disabled = !0, c.appendChild(m), (e = document.createElement("button")).id = "helpBtn", e.innerHTML = "?", c.appendChild(e), (c = document.createElement("span")).id = "status", c.innerHTML = "(loading)", o.appendChild(c), a.onchange = function(e) {
     var t;
     0 !== a.files.length && (t = a.files[0].name, d.value.startsWith("/") || (d.value = "/" + d.value), d.value = getParentFolder(d.value) + "/" + t)
},
l.onclick = function(e) {
    0 !== a.files.length && n.httpUpload(a.files[0], d.value)
}, i.onclick = function(e) {
    var t = d.value.trim();
    "" === t ? alert("A filename must be given") : t.endsWith("/") ? alert("Filenames must not end with a '/' character") : n.httpCreate(t)
}, s.onclick = function(e) {
    var t = d.value.trim();
    "" === t ? alert("A folder name must be given") : (t.endsWith("/") || (t += "/"), n.httpCreate(t))
}, r.onclick = function(e) {
    t.save()
}, m.onclick = function(e) {
    t.discard()
}, e.onclick = function(e) {
    t.showShortcuts()
}
}

function createTree(e, a) {
var n = document.getElementById("preview"),
    t = document.createElement("div");

function d(e) {
    document.getElementById("pathInput").value = e, document.getElementById("editor").style.display = "none", document.getElementById("editorButtons").style.display = "none", n.style.display = "block", n.innerHTML = "<img src='" + e + "' style='max-width:100%; max-height:100%; margin:auto; display:block;' />"
}

function l(e) {
    document.getElementById("pathInput").value = e, document.getElementById("editor").style.display = "none", document.getElementById("editorButtons").style.display = "none", n.style.display = "block", n.innerHTML = "<span style='color:red;'>Ace editor could not be loaded from the internet nor from /edit/ace.js . Defaulting to text viewer...</span><pre id='txtContents' style='overflow: auto;'></pre>";
    var t = new XMLHttpRequest;
    t.onload = function() {
        document.getElementById("txtContents").textContent = this.responseText
    }, t.open("GET", e), t.send()
}

function s(e) {
    if (void 0 !== (e = /(?:\.([^.]+))?$/.exec(e)[1])) switch (e.toLowerCase()) {
        case "txt":
        case "htm":
        case "html":
        case "js":
        case "json":
        case "c":
        case "h":
        case "cpp":
        case "css":
        case "xml":
            return 1
    }
}

function i(e) {
    if (void 0 !== (e = /(?:\.([^.]+))?$/.exec(e)[1])) switch (e.toLowerCase()) {
        case "png":
        case "jpg":
        case "jpeg":
        case "gif":
        case "ico":
            return 1
    }
}

function r(n, o) {
    var e = document.createElement("ul");
    n.appendChild(e);
    var t = document.createElement("li");
    e.appendChild(t), s(o) ? "undefined" == typeof ace ? (t.innerHTML = "<span>View</span>", t.onclick = function(e) {
        0 < document.body.getElementsByClassName("contextMenu").length && document.body.removeChild(n), canLoadNewContents() && l(o)
    }) : (t.innerHTML = "<span>Edit</span>", t.onclick = function(e) {
        0 < document.body.getElementsByClassName("contextMenu").length && document.body.removeChild(n), canLoadNewContents() && a.loadUrl(o)
    }) : i(o) && (t.innerHTML = "<span>Preview</span>", t.onclick = function(e) {
        0 < document.body.getElementsByClassName("contextMenu").length && document.body.removeChild(n), canLoadNewContents() && d(o)
    }), t = document.createElement("li"), e.appendChild(t), t.innerHTML = "<span>Download</span>", t.onclick = function(e) {
        var t;
        0 < document.body.getElementsByClassName("contextMenu").length && document.body.removeChild(n), t = o, document.getElementById("download-frame").src = t + "?download=true"
    }, t = document.createElement("li"), e.appendChild(t), t.innerHTML = "<span>Rename/Move</span>", t.onclick = function(e) {
        0 < document.body.getElementsByClassName("contextMenu").length && document.body.removeChild(n);
        var t = prompt("Rename " + o + " to", o);
        null != t && t != o && p(o, t)
    }, t = document.createElement("li"), e.appendChild(t), t.innerHTML = "<span>Delete</span>", t.onclick = function(e) {
        0 < document.body.getElementsByClassName("contextMenu").length && document.body.removeChild(n), h(o)
    }
}

function c(e, t, n) {
    var o = document.createElement("div"),
        a = document.body.scrollTop || document.documentElement.scrollTop,
        d = document.body.scrollLeft || document.documentElement.scrollLeft,
        l = e.clientX + d,
        s = e.clientY + a;
    o.className = "contextMenu", o.style.display = "block", o.style.left = l + "px", o.style.top = s + "px", (n ? r : function(n, o) {
        var e = document.createElement("ul");
        n.appendChild(e);
        var t = document.createElement("li");
        e.appendChild(t);
        var a = document.getElementById(o).childNodes[0].checked,
            t = document.createElement("li");
        e.appendChild(t), a ? (t.innerHTML = "<span>Collapse</span>", t.onclick = function(e) {
            0 < document.body.getElementsByClassName("contextMenu").length && document.body.removeChild(n), document.getElementById(o).childNodes[0].checked = !1
        }, a = document.createElement("li"), e.appendChild(a), a.innerHTML = "<span>Refresh</span>", a.onclick = function(e) {
            0 < document.body.getElementsByClassName("contextMenu").length && document.body.removeChild(n), m(o)
        }) : (t.innerHTML = "<span>Expand</span>", t.onclick = function(e) {
            0 < document.body.getElementsByClassName("contextMenu").length && document.body.removeChild(n), document.getElementById(o).childNodes[0].checked = !0, m(o)
        }), t = document.createElement("li"), e.appendChild(t), t.innerHTML = "<span>Rename/Move</span>", t.onclick = function(e) {
            0 < document.body.getElementsByClassName("contextMenu").length && document.body.removeChild(n);
            var t = prompt("Rename " + o + " to", o);
            null != t && t != o && p(o, t)
        }, t = document.createElement("li"), e.appendChild(t), t.innerHTML = "<span>Delete</span>", t.onclick = function(e) {
            0 < document.body.getElementsByClassName("contextMenu").length && document.body.removeChild(n), h(o)
        }
    })(o, t), document.body.appendChild(o);
    var i = o.offsetWidth,
        c = o.offsetHeight;
    o.onmouseout = function(e) {
        (e.clientX < l || e.clientX > l + i || e.clientY < s || e.clientY > s + c) && 0 < document.body.getElementsByClassName("contextMenu").length && document.body.removeChild(o)
    }
}

function o(t, n) {
    return function() {
        var e;
        setLoading(!1), 200 != t.status ? showHttpError(t) : n ? (e = getParentFolder(n), t.responseText && t.responseText != e && refreshPath(t.responseText), refreshPath(e), attemptLoad(n)) : refreshPath(t.responseText), refreshStatus()
    }
}

function m(e, t) {
    var n, o, a;
    setLoading(!0, "Listing '" + e + "'..."), xmlHttp = new XMLHttpRequest, xmlHttp.onload = (n = xmlHttp, o = e, a = t, function() {
        var e, t;
        setLoading(!1), 200 != n.status ? showHttpError(n) : (!(e = document.getElementById(o)) || (t = e.lastElementChild) && "UL" == t.tagName && e.removeChild(t), function(e, t) {
            t.sort(function(e, t) {
                return e.type == t.type ? e.name.localeCompare(t.name) : e.type.localeCompare(t.type)
            });
            var n = document.createElement("ul");
            document.getElementById(e).appendChild(n);
            for (var o = t.length, a = 0; a < o; a++) {
                var d = "file" === (d = t[a]).type ? function(e, t, n) {
                    var o = document.createElement("li");
                    return o.id = ("/" == e ? "" : e) + "/" + t, e = document.createElement("span"), s(t) ? e.classList.add("txt") : i(t) && e.classList.add("img"), e.innerHTML = t + " <i>(" + readableSize(n) + ")</i>", o.appendChild(e), o.onclick = function(e) {
                        attemptLoad(o.id)
                    }, o.oncontextmenu = function(e) {
                        e.preventDefault(), e.stopPropagation(), c(e, o.id, !0)
                    }, o
                }(e, d.name, d.size) : function(e, t, n) {
                    var o = document.createElement("li");
                    o.id = ("/" == e ? "" : e) + "/" + t;
                    var a = document.createElement("input");
                    return a.type = "checkbox", void 0 !== n && n && (a.disabled = "disabled"), o.appendChild(a), (n = document.createElement("label")).textContent = t, o.appendChild(n), a.onchange = function(e) {
                        a.checked && m(o.id)
                    }, n.onclick = function(e) {
                        a.checked ? a.checked = !1 : (a.checked = !0, m(o.id))
                    }, o.oncontextmenu = function(e) {
                        e.preventDefault(), e.stopPropagation(), c(e, o.id, !1)
                    }, o
                }(e, d.name);
                n.appendChild(d)
            }
        }(o, JSON.parse(n.responseText)), void 0 !== document.getElementById(o).childNodes[0].checked && (document.getElementById(o).childNodes[0].checked = !0), a && a.length && u(a))
    }), xmlHttp.open("GET", "/list?dir=" + e, !0), xmlHttp.send(null)
}

function u(e) {
    var t = e.pop();
    t && m(t, e)
}

function p(e, t) {
    setLoading(!0, "Renaming '" + e + "' to '" + t + "'..."), t.startsWith("/") || (t = "/" + t), xmlHttp = new XMLHttpRequest, xmlHttp.onload = o(xmlHttp, t);
    var n = new FormData;
    n.append("path", t), n.append("src", e), xmlHttp.open("PUT", "/edit"), xmlHttp.send(n)
}

function h(e) {
    setLoading(!0, "Deleting '" + e + "'..."), xmlHttp = new XMLHttpRequest, xmlHttp.onload = o(xmlHttp);
    var t = new FormData;
    t.append("path", e), xmlHttp.open("DELETE", "/edit"), xmlHttp.send(t)
}
return t.className = "css-treeview", t.id = "/", document.getElementById(e).appendChild(t), this.clearMainPanel = function() {
    document.getElementById("editor").style.display = "none", document.getElementById("editorButtons").style.display = "none", n.style.display = "block", n.innerHTML = "<div style='text-align:center'>(file not found or format not supported)</div>"
}, this.attemptLoad = function(e) {
    console.log("Attempting load of '" + e + "'..."), document.getElementById("pathInput").value = e, canLoadNewContents() && (s(e) ? "undefined" == typeof ace ? l(e) : a.loadUrl(e) : i(e) ? d(e) : clearMainPanel())
}, this.refreshPath = function(e) {
    if ("SPIFFS" == fsInfo.type) console.log("Refreshing '/'..."), m("/");
    else if (console.log("Refreshing '" + e + "'..."), -1 == e.lastIndexOf("/")) m("/");
    else {
        for (var t = [], n = e; - 1 != n.lastIndexOf("/") && !document.getElementById(n);) t.push(n), n = getParentFolder(n);
        "" == n ? t.push("/") : t.push(n), u(t)
    }
}, this.httpUpload = function(e, t) {
    setLoading(!0, "Uploading '" + t + "'..."), t.startsWith("/") || (t = "/" + t), xmlHttp = new XMLHttpRequest, xmlHttp.onload = o(xmlHttp, t);
    var n = new FormData;
    n.append("data", e, t), xmlHttp.open("POST", "/edit"), xmlHttp.send(n)
}, this.httpCreate = function(e) {
    setLoading(!0, "Creating '" + e + "'..."), e.startsWith("/") || (e = "/" + e), xmlHttp = new XMLHttpRequest, xmlHttp.onload = o(xmlHttp, e);
    var t = new FormData;
    t.append("path", e), xmlHttp.open("PUT", "/edit"), xmlHttp.send(t)
}, m("/"), this
}

function createEditor(e, t, n, o, a) {
function d(e) {
    var t = "plain",
        n = /(?:\.([^.]+))?$/.exec(e)[1];
    if (void 0 !== n) switch (n) {
        case "txt":
            t = "plain";
            break;
        case "htm":
            t = "html";
            break;
        case "js":
            t = "javascript";
            break;
        case "c":
        case "cpp":
            t = "c_cpp";
            break;
        case "css":
        case "scss":
        case "php":
        case "html":
        case "json":
        case "xml":
            t = n
    }
    return t
}
void 0 === t && (t = "/index.htm"), void 0 === n && (n = d(t)), void 0 === o && (o = "textmate"), void 0 === a && (a = "c_cpp" === n ? "text/plain" : "text/" + n);
var l = null,
    s = ace.edit(e);

function i() {
    setLoading(!1), 200 != l.status && showHttpError(l), tree.refreshPath(getParentFolder(t)), refreshStatus()
}

function c() {
    setLoading(!1), document.getElementById("preview").style.display = "none", document.getElementById("editor").style.display = "block", document.getElementById("editorButtons").style.display = "inline", 200 == l.status ? (s.setValue(l.responseText), s.clearSelection(), enableSaveDiscardBtns(!1)) : tree.clearMainPanel()
}

function r(e) {
    setLoading(!0, "Loading '" + e + "'..."), (l = new XMLHttpRequest).onload = c, l.open("GET", e, !0), l.send(null)
}
return "plain" !== n && s.getSession().setMode("ace/mode/" + n), s.setTheme("ace/theme/" + o), s.$blockScrolling = 1 / 0, s.getSession().setUseSoftTabs(!0), s.getSession().setTabSize(2), s.setHighlightActiveLine(!0), s.setShowPrintMargin(!1), s.commands.addCommand({
    name: "save",
    bindKey: {
        win: "Ctrl-S",
        mac: "Command-S"
    },
    exec: function(e) {
        e.save()
    },
    readOnly: !1
}), s.commands.addCommand({
    name: "showKeyboardShortcuts",
    bindKey: {
        win: "Ctrl-Alt-h",
        mac: "Command-Alt-h"
    },
    exec: function(e) {
        e.showShortcuts()
    }
}), s.session.on("change", function(e) {
    enableSaveDiscardBtns(!0)
}), s.loadUrl = function(e) {
    document.getElementById("pathInput").value = e, enableSaveDiscardBtns(!1), n = d(t = e), a = "text/" + n, "plain" !== n && s.getSession().setMode("ace/mode/" + n), r(t)
}, s.save = function() {
    enableSaveDiscardBtns(!1),
        function(e, t, n) {
            setLoading(!0, "Saving '" + e + "'..."), (l = new XMLHttpRequest).onload = i;
            var o = new FormData;
            o.append("data", new Blob([t], {
                type: n
            }), e), l.open("POST", "/edit"), l.send(o)
        }(t, s.getValue() + "", a)
}, s.discard = function() {
    s.loadUrl(t), enableSaveDiscardBtns(!1)
}, s.showShortcuts = function() {
    ace.config.loadModule("ace/ext/keybinding_menu", function(e) {
        e.init(s), s.showKeyboardShortcuts()
    })
}, r(t), s
}

function onBodyLoad() {
var e, o = {};
window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(e, t, n) {
    o[t] = n
}), "undefined" != typeof ace && (e = createEditor("editor", o.file, o.lang, o.theme)), createHeader("header", tree = createTree("tree", e), e), refreshStatus()
}

var script;
"undefined" == typeof ace && (console.log("Cannot load ace.js from the web, trying local copy"), (script = document.createElement("script")).src = "/edit/ace.js", script.async = !1, document.head.appendChild(script)) 