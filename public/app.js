const API = '/api';
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
const $ = (id) => document.getElementById(id);
const app = $('app');
const money = (n) => '₹' + Number(n).toLocaleString('en-IN');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(path, method = 'GET', body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); renderNav(); }
function renderNav() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  $('nav').innerHTML = `
    <button class="alt" onclick="show('products')">Shop</button>
    <button class="alt" onclick="show('cart')">Cart (${count})</button>
    ${user ? `<button class="alt" onclick="show('orders')">My Orders</button>` : ''}
    ${user?.role === 'admin' ? `<button onclick="show('admin')">Admin</button>` : ''}
    ${user ? `<button class="danger" onclick="logout()">Logout (${esc(user.name)})</button>`
           : `<button onclick="show('login')">Login</button><button onclick="show('register')">Register</button>`}`;
}
function logout() { token = null; user = null; localStorage.removeItem('token'); localStorage.removeItem('user'); renderNav(); show('products'); }
function show(v) { ({ products, cart: viewCart, login, register, orders, admin, checkout }[v])(); }

async function products() {
  app.innerHTML = `<div class="toolbar"><input id="s" placeholder="Search products..."><select id="c"><option value="">All categories</option><option>Electronics</option><option>Fashion</option><option>Home</option><option>General</option></select><button onclick="loadProducts()">Search</button></div><div id="list" class="grid">Loading...</div>`;
  loadProducts();
}
async function loadProducts() {
  const q = new URLSearchParams({ search: $('s').value, category: $('c').value });
  try {
    const list = await api('/products?' + q);
    $('list').innerHTML = list.map((p) => `<div class="card">
      <img src="${esc(p.image)}" alt="" onerror="this.style.visibility='hidden'">
      <h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>
      <div class="row"><span class="price">${money(p.price)}</span><span class="badge">${p.stock > 0 ? p.stock + ' in stock' : 'Out of stock'}</span></div>
      <button ${p.stock < 1 ? 'disabled' : ''} onclick="addToCart('${p._id}')" style="margin-top:8px">Add to cart</button></div>`).join('') || 'No products found.';
    window._products = Object.fromEntries(list.map((p) => [p._id, p]));
  } catch (e) { $('list').textContent = e.message; }
}
function addToCart(id) {
  const p = window._products[id];
  const line = cart.find((i) => i.product === id);
  if (line) { if (line.qty < p.stock) line.qty++; } else cart.push({ product: id, name: p.name, price: p.price, qty: 1 });
  saveCart();
}

function viewCart() {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  app.innerHTML = `<h2>Your Cart</h2>` + (cart.length ? `<table><tr><th>Item</th><th>Price</th><th>Qty</th><th></th></tr>
    ${cart.map((i, n) => `<tr><td>${esc(i.name)}</td><td>${money(i.price)}</td>
      <td><input type="number" min="1" value="${i.qty}" style="width:70px" onchange="cart[${n}].qty=Math.max(1,+this.value);saveCart();viewCart()"></td>
      <td><button class="danger" onclick="cart.splice(${n},1);saveCart();viewCart()">Remove</button></td></tr>`).join('')}</table>
    <h3>Total: ${money(total)}</h3><button onclick="show('checkout')">Proceed to Checkout</button>` : '<p>Cart is empty.</p>');
}

function checkout() {
  if (!user) return show('login');
  if (!cart.length) return show('cart');
  app.innerHTML = `<div class="box form"><h2>Checkout</h2><textarea id="addr" placeholder="Shipping address"></textarea>
    <p>Total: <b>${money(cart.reduce((s, i) => s + i.price * i.qty, 0))}</b> (Cash on Delivery)</p>
    <div id="err" class="msg"></div><button onclick="placeOrder()">Place Order</button></div>`;
}
async function placeOrder() {
  try {
    await api('/orders', 'POST', { items: cart.map(({ product, qty }) => ({ product, qty })), address: $('addr').value });
    cart = []; saveCart(); alert('Order placed!'); show('orders');
  } catch (e) { $('err').textContent = e.message; }
}

function authForm(kind) {
  app.innerHTML = `<div class="box form"><h2>${kind === 'login' ? 'Login' : 'Register'}</h2>
    ${kind === 'register' ? '<input id="n" placeholder="Name">' : ''}<input id="e" placeholder="Email"><input id="p" type="password" placeholder="Password">
    <div id="err" class="msg"></div><button onclick="submitAuth('${kind}')">${kind === 'login' ? 'Login' : 'Create account'}</button></div>`;
}
const login = () => authForm('login'), register = () => authForm('register');
async function submitAuth(kind) {
  try {
    const data = await api('/auth/' + kind, 'POST', { name: $('n')?.value, email: $('e').value, password: $('p').value });
    token = data.token; user = data.user;
    localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user));
    renderNav(); show(cart.length ? 'cart' : 'products');
  } catch (e) { $('err').textContent = e.message; }
}

async function orders() {
  if (!user) return show('login');
  app.innerHTML = '<h2>My Orders</h2><div id="o">Loading...</div>';
  try {
    const list = await api('/orders/mine');
    $('o').innerHTML = list.map((o) => `<div class="box" style="margin-bottom:10px"><div class="row"><b>#${o._id.slice(-6)}</b>
      <span class="badge">${o.status}</span><span>${new Date(o.createdAt).toLocaleString()}</span><span class="price">${money(o.total)}</span></div>
      <small>${o.items.map((i) => `${esc(i.name)} × ${i.qty}`).join(', ')}</small></div>`).join('') || 'No orders yet.';
  } catch (e) { $('o').textContent = e.message; }
}

async function admin() {
  if (user?.role !== 'admin') return show('products');
  app.innerHTML = `<h2>Admin Panel</h2><div class="box"><h3>Add product</h3>
    <div class="row"><input id="an" placeholder="Name"><input id="ap" type="number" placeholder="Price"><input id="as" type="number" placeholder="Stock"></div>
    <div class="row"><input id="ac" placeholder="Category"><input id="ai" placeholder="Image URL"></div>
    <input id="ad" placeholder="Description"><div id="err" class="msg"></div><button onclick="addProduct()">Add</button></div>
    <h3>Products</h3><div id="ap-list"></div><h3>All Orders</h3><div id="ao-list"></div>`;
  loadAdmin();
}
async function loadAdmin() {
  const [ps, os] = await Promise.all([api('/products'), api('/orders')]);
  $('ap-list').innerHTML = `<table><tr><th>Name</th><th>Price</th><th>Stock</th><th></th></tr>${ps.map((p) => `<tr><td>${esc(p.name)}</td><td>${money(p.price)}</td>
    <td><input type="number" value="${p.stock}" style="width:80px" onchange="updateStock('${p._id}',this.value)"></td>
    <td><button class="danger" onclick="delProduct('${p._id}')">Delete</button></td></tr>`).join('')}</table>`;
  $('ao-list').innerHTML = `<table><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th></tr>${os.map((o) => `<tr><td>#${o._id.slice(-6)}</td>
    <td>${esc(o.user?.name)}<br><small>${esc(o.address)}</small></td><td>${money(o.total)}</td>
    <td><select onchange="setStatus('${o._id}',this.value)">${['Pending', 'Shipped', 'Delivered', 'Cancelled'].map((s) => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`).join('')}</table>`;
}
async function addProduct() {
  try {
    await api('/products', 'POST', { name: $('an').value, price: +$('ap').value, stock: +$('as').value, category: $('ac').value || 'General', image: $('ai').value, description: $('ad').value });
    admin();
  } catch (e) { $('err').textContent = e.message; }
}
async function updateStock(id, v) { const p = await api('/products/' + id); await api('/products/' + id, 'PUT', { ...p, stock: +v }); }
async function delProduct(id) { if (confirm('Delete product?')) { await api('/products/' + id, 'DELETE'); loadAdmin(); } }
async function setStatus(id, status) { await api(`/orders/${id}/status`, 'PUT', { status }); }

renderNav(); products();
