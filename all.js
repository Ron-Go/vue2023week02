import { createApp, ref, reactive, toRefs } from 'https://cdnjs.cloudflare.com/ajax/libs/vue/3.2.45/vue.esm-browser.min.js';

// 匯入“登入狀態”
import { jumpAlert } from './mixinjumpAlert.js';

// 產品細節
const productDetail = {
  template:
    `<div class="modal fade" id="detailModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">單一產品細節</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="col-md-12">
              <div class="card mb-3">
                <img :src="product?.imageUrl" class="card-img-top primary-image" alt="主圖">
                <div class="card-body">
                  <h5 class="card-title">
                    {{ product?.title }}
                    <span class="badge bg-primary ms-2">{{ product?.category }}</span>
                  </h5>
                  <p class="card-text">商品描述：{{ product?.description }}</p>
                  <p class="card-text">商品內容：{{ product?.content }}</p>
                  <div class="d-flex">
                    <p class="card-text me-2">{{ product?.price }}</p>
                    <p class="card-text text-secondary"><del>{{ product?.origin_price }}</del></p>
                    元 / {{ product?.unit }}
                  </div>
                </div>
              </div>
              <span v-for="(image,id) in product?.imagesUrl" :key="id">
                <img v-if="image" :src="image" class="images mb-2" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>`,
  props: ['item'],
  setup(props) {
    const { item: product } = toRefs(props);
    return {
      product,
    };
  }
};

// 產品清單
const admin = {
  components: {
    productDetail
  },
  template: `
  <!-- 登入驗證、取得產品資料後才渲染畫面 -->
  <div v-if="checkResult && products.length">
    <div class="container">
      <div class="row py-3">
        <div class="col-md-8 mx-auto">
          <div class="d-flex align-items-center"> 
            <h2 class="mb-0">產品列表</h2>
            <button class="btn btn-md btn-outline-danger ms-auto" @click="logOut">登出</button>
          </div>
          <table class="table table-hover mt-4">
            <thead>
              <tr>
                <th width="150">產品名稱</th>
                <th width="120" @click="itemSort('origin_price')">原價</th>
                <th width="120" @click="itemSort('price')">售價</th>
                <th width="150" @click="itemSort('is_enabled')">是否啟用</th>
                <th width="120">查看細節</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in products" :key="item.id">
                <td width="150">{{ item.title }}</td>
                <td width="120">{{ item.origin_price }}</td>
                <td width="120">{{ item.price }}</td>
                <td width="150">
                  <!-- item.is_enabled用v-bind綁定class樣式 -->
                  <!-- click行為觸發changeStatus()，代入id尋找對應商品物件資料並更改is_enabled屬性 -->
                  <span :class="{ 'text-success': item.is_enabled, 'text-danger': !item.is_enabled}"
                  @click="changeStatus(item.id)">{{item.is_enabled ? '啟用' : '未啟用'}}</span>
                </td>
                <td width="120">
                  <!-- click行為觸發openModal()開啟互動視窗 -->
                  <button type="button" class="btn btn-primary" @click="openModal(item)">
                    查看細節
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <p>目前有 <span>{{ products.length }}</span> 項產品</p>
        </div>
      </div>
    </div>
    <product-detail :item="tempProduct" ref="componentDom"></product-detail>
  </div>
  <div v-else></div>
  `,
  setup(props) {
    const { url, path } = props.api;
    let products = ref([]);
    // 登入驗證為true，才會渲染內容
    let checkResult = ref(false);

    // 連續性請求
    (async () => {
      // 從cookie取得token
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)myToken\s*\=\s*([^;]*).*$)|^.*$/, "$1");
      axios.defaults.headers.common["Authorization"] = token;
      try {
        // 驗證登入狀態
        const res1 = await axios.post(`${url}/api/user/check`)
        checkResult.value = res1.data.success;
        // 取得全部商品
        const res2 = await axios.get(`${url}/api/${path}/admin/products`)
        products.value = res2.data.products;
      } catch (error) {
        jumpAlert('login', error.response.data.message, 'error');
      }
    })();

    // 產品細節
    const tempProduct = ref();
    // 顯示modal視窗
    const openModal = (data) => {
      const productModal = new bootstrap.Modal(document.getElementById('detailModal'));
      tempProduct.value = data;
      productModal.show();
    };

    // 產品列表項目排序
    const itemSort = (attr) => {
      products.value.sort((a, b) => {
        return b[attr] - a[attr];
      })
    };
    // 登出
    const logOut = () => {
      axios.post(`${url}/logout`)
      .then(res => {
        jumpAlert('logout', res.data.message, 'success');
      })
      .catch(err => {
        jumpAlert('logout', err.response.data.message, 'error');
      });
    };
    return {
      products,
      checkResult,
      tempProduct,
      openModal,
      itemSort,
      logOut,
    };
  },
  props: ['api']
};

const app = createApp({
  components: {
    admin
  },
  setup() {
    // api
    const api = {
      url: 'https://vue3-course-api.hexschool.io/v2',
      path: 'vue2022ron',
    };
    // 登入帳密
    const adminData = reactive({});
    // 登入
    const signin = () => {
      axios.post(`${api.url}/admin/signin`, adminData)
      .then(res => {
        resetAdminData();
        const { expired, message, token } = res.data;
        jumpAlert('login', message, 'success');
        // 把token、expired存入cookie
        document.cookie = `myToken = ${token}; expires = ${new Date(expired)};`;
      })
      .catch(err => {
        resetAdminData();
        const { error, message } = err.response.data;
        jumpAlert('login', message, 'error');
      });
    };
    // 清空adminData
    const resetAdminData = () => {
      adminData.username = '';
      adminData.password = '';
    };
    // 點擊登入按鈕
    const loginBtn = e => {
      e.preventDefault();
      if (adminData.account === '' || adminData.password === '') return;
      signin();
    };
    return{
      api,
      adminData,
      loginBtn,
    }
  }
});
app.mount('#app');

// const productModal = window.location.pathname === "/week02/admin.html" ? new bootstrap.Modal(document.getElementById('detailModal')) : '';
