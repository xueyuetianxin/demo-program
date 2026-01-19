<template>
  <div class="pages">
    <div class="item_title">出勤休假</div>
    <div class="item_body">
      <div class="item_self">
        <img 
          class="icon" 
          src="/officeicon/leave.png" 
          alt="" 
        />
        <span>请假</span>
      </div>
      <div class="item_self">
        <img 
          class="icon" 
          src="/officeicon/cooperate.png" 
          alt="" 
        />
        <span>外出</span>
      </div>
      <div class="item_self">
        <img 
          class="icon" 
          src="/officeicon/overtime.png" 
          alt="" 
        />
        <span>加班</span>
      </div>
      <div class="item_self">
        <img 
          class="icon" 
          src="/officeicon/leave.png" 
          alt="" 
        />
        <span>补卡申请</span>
      </div>
    </div>
    <div class="item_title">人事</div>
    <div class="item_body">
      <div class="item_self">
        <img 
          class="icon" 
          src="/officeicon/cooperate.png" 
          alt="" 
        />
        <span>转正</span>
      </div>
      <div class="item_self">
        <img 
          class="icon" 
          src="/officeicon/recruit.png" 
          alt="" 
        />
        <span>招聘</span>
      </div>
    </div>
    <div class="item_title">财务</div>
    <div class="item_body">
      <div class="item_self">
        <img 
          class="icon" 
          src="/officeicon/property.png" 
          alt="" 
        />
        <span>报销</span>
      </div>
      <div class="item_self">
        <img 
          class="icon" 
          src="/officeicon/property.png" 
          alt="" 
        />
        <span>备用金申请</span>
      </div>
      <div class="item_self">
        <img 
          class="icon" 
          src="/officeicon/cooperate.png" 
          alt="" 
        />
        <span>付款申请</span>
      </div>
    </div>
    <div class="item_title">行政</div>
    <div class="item_body">
      <div class="item_self">
        <img 
          class="icon" 
          src="/officeicon/usecar.png" 
          alt="" 
        />
        <span>用车申请</span>
      </div>
      <div class="item_self">
        <img 
          class="icon" 
          src="/officeicon/cooperate.png" 
          alt="" 
        />
        <span>物品领用</span>
      </div>
      <div class="item_self">
        <img 
          class="icon" 
          src="/officeicon/cooperate.png" 
          alt="" 
        />
        <span>用印申请</span>
      </div>
      <div class="item_self">
        <img 
          class="icon" 
          src="/officeicon/cooperate.png" 
          alt="" 
        />
        <span>通用审批</span>
      </div>
    </div>
    <div class="item_title">市场</div>
    <div class="item_body">
      <div class="item_self">
        <img 
          class="icon" 
          src="/officeicon/idear.png" 
          alt="" 
        />
        <span>订单信息</span>
      </div>
      <div class="item_self">
        <img 
          class="icon" 
          src="/officeicon/tuiguan1.png" 
          alt="" 
        />
        <span>推广</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Operation } from '@element-plus/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user'
import { apiMeInfo } from '@/api/user'

</script>

<style scoped lang="scss">
.pages{
  padding: 20px;
  .item_title{
    color: #727477;
    margin: 10px 0;
  }
  .item_body{
    display: flex;
    align-items: center;
    .item_self{
      padding: 10px;
      display: flex;
      align-items: center;
      background-color: #fff;
      margin: 0 20px 0 0;
      border-radius: 6px;
      cursor: pointer;
      .icon{
        width: 30px;
        height: 30px;
        margin-right: 10px;
      }
    }
  }
}
</style>