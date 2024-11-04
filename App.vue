<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
onLaunch(() => { })
onShow(() => { })
onHide(() => { })
</script>

<style lang="scss">
/*每个页面公共css */
@import '@/uni_modules/uni-scss/index.scss';
// 设置整个项目的背景色
page {
    background-color: #f5f5f5;
}
uni-page-body,html,body,page{  
    height: 100%;  
}  
</style>