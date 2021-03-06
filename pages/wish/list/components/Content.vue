<template>
	<scroll-view :scroll-top="scrollTop" :scroll-y="scrollY" class="scroll-Y content-wrapper" @scroll="scroll" @click.stop="resetListMenu">
		<view class="wish-list" :class="[pageTheme]">
			<view class="wish-item"
						:class="[wish.id === menuMoveWish ? reverseClass : '', pageTheme, {'convert' : wish.isCompleted}]"
						v-for="wish in wishList"
						:key="wish.id"
						:data-wishid="wish.id"
						:style="menuMoveWish === wish.id ? itemMoveStyle : ''"
						@touchstart="handleTouchStart"
						@touchmove="handleTouchMove"
						@touchend.prevent="handleTouchEnd"
						@click.stop="resetListMenu"
			>
				<!-- 愿望图片 -->
				<view class="image-wrapper">
					<view class="icon iconfont icondiamond1" v-if="!wish.image" :class="[wish.color]"></view>
					<image :mode="'aspectFill'"
								 class="image"
								 :src="wish.image"
								 v-if="wish.image"
					></image>
				</view>
				<!-- 愿望信息 -->
				<view class="wish-info">
					<view class="title" v-text="wish.name"></view>
					<view class="info" v-text="`${wish.completedCount}/${wish.happy_coin}`"></view>
				</view>
				<!-- 愿望进度条 -->
				<view class="progress bdcolor" :style="{width: wish.completedStyle}" :class="[wish.color, {completed: wish.isCompleted}]"></view>
				<view class="progress bgprogress bdcolor" :class="[wish.color]"></view>
				<!-- 默认主题菜单 -->
				<view class="wish-menu wish-edit bgcolor warning"
							@click.stop="handleEditWishClick(wish.id)" 
							v-if="pageTheme === 'default'"
				>
					<view class="menu-icon icon iconfont iconpencil"></view>
					<view class="menu-title">编辑</view>
				</view>
				<view class="wish-menu wish-delete bgcolor danger" 
							:class="{open: listMenuState}"
							@click.stop="handleDelWishClick(wish.id)"
							v-if="pageTheme === 'default'"
				>
					<view class="menu-icon icon iconfont icontrash"></view>
					<view class="menu-title">删除</view>
				</view>
				<!-- 卡片主题菜单 -->
				<view class="wish-menu" v-if="pageTheme === 'card' && cardMenuState && wish.id === menuMoveWish">
					<view class="image-wrapper">
						<view class="icon iconfont icondiamond1 warning" v-if="!wish.image"></view>
						<image :mode="'aspectFill'"
									 class="image"
									 :src="wish.image"
									 v-if="wish.image"
						></image>
					</view>
					<view class="title" v-text="wish.name"></view>
					<view class="operate">
						<view class="operate-item bgcolor warning" @click.stop="handleEditWishClick(wish.id)" >
							<view class="icon iconfont iconpencil"></view>
							<view class="edit-title">编辑</view>
						</view>
						<view class="operate-item bgcolor danger" @click.stop="handleDelWishClick(wish.id)">
							<view class="icon iconfont icontrash"></view>
							<view class="delete-title">删除</view>
						</view>
						<view class="operate-item cancel bgcolor success" @click.stop="handleCanceClick">
							<view class="cancel-title">取消</view>
						</view>
					</view>
					
				</view>
				<view class="stamp" v-if="!wish.redeem && !cardMenuState && wish.isCompleted" @click="convertHappyCoin(wish)">
					<view class="content">可兑换</view>
				</view>
				<view class="stamp" v-else-if="wish.redeem && !cardMenuState && wish.isCompleted">
					<view class="content">已兑换</view>
				</view>
			</view>
		</view>
	</scroll-view>
</template>

<script>
	import { mapState } from 'vuex'
	import { deleteWishById } from '@/common/dataOperate/controller/WishDataController'
	
	export default {
		name: 'WishListContent',
		props: {
			//主题类型
			pageTheme: {
				type: String,
				default: 'default'
			},
			//页面状态，展示内容
			pageState: {
				type: String,
				default: 'no-redeem'
			}
		},
		
		data() {
			return {
				//列表是否可滚动的状态位
				scrollDirection: true,
				//记录初始位置
				startX: 0,
				startY: 0,
				//用于列表主题下,函数节流
				timer:  null,
				//卡片模式下是否处于展示菜单的状态
				cardMenuState: false,
				//当前操作愿望ID
				menuMoveWish: '',
				//列表主题下，记录移动距离
				menuMoveCount: 0,
				//滑动状态
				touchStatus: false,
				scrollTop: 0,
				old: {
					scrollTop: 0
				},
				screenWidth: uni.getSystemInfoSync().windowWidth * 0.4,
			}
		},
		
		watch: {
			//监听主题变化,在主题变化后重置页面所有状态
			pageTheme () {
				this.handleCanceClick();
			}
		},
		
		computed: {
			scrollY () {
				return this.scrollDirection && !this.listMenuState; 
			},
			//卡片模式下,计算是否反转,用于展示菜单
			reverseClass () {
				return this.cardMenuState ? 'reverse' : '';
			},
			//列表模式下,计算菜单是否展开
			listMenuState () {
				return this.menuMoveCount === -380;
			},
			//列表模式下,计算列表移动距离
			itemMoveStyle () {
				return 'right:' + Math.abs(this.menuMoveCount) + 'rpx;';
			},
			//依据页面状态计算展示列表
			wishList () {
				let temp_wishList = [];
				if (this.wishData.wishIdArray) {
					for (let id of this.wishData.wishIdArray) {
						let wish = this.wishData.wishObj[id]; 
						if (wish.isDel) continue;
						if (this.pageState === 'no-redeem' && wish.redeem) continue;
						if (this.pageState === 'redeem' && !wish.redeem) continue;
						let tempWish = {};
						tempWish.id = wish.id;
						tempWish.image = wish.image;
						tempWish.name = wish.name;
						tempWish.happy_coin = wish.happy_coin;
						tempWish.completedCount = this.happyCoin > wish.happy_coin ? wish.happy_coin : this.happyCoin;
						tempWish.completedStyle = `${tempWish.completedCount / wish.happy_coin * 100}%`;
						tempWish.isCompleted = this.happyCoin >= tempWish.completedCount && tempWish.completedCount > 0;
						tempWish.color = wish.color;
						tempWish.redeem = wish.redeem;
						temp_wishList.push(tempWish);
					}
				}
				return temp_wishList;
			},
			...mapState({
				wishData: state => state.wishData,
				happyCoin: state => state.completedData.happyCoinPool
			})
		},
		methods: {
			//兑换物品
			convertHappyCoin (wish) {
				this.$emit('convertHappyCoin', wish);
			},
			
			//卡片模式-点击取消按钮
			handleCanceClick () {
				this.cardMenuState = false;
				this.resetListMenu();
			},
			
			//重置列表状态
			resetListMenu () {
				//排除长按对click的影响
				if (this.cardMenuState) return;
				if (this.menuMoveCount < -15) {
					let interval = setInterval(() => {
						this.menuMoveCount += 15;
						if (this.menuMoveCount >= 0) {
							 this.menuMoveCount =  0;
							 this.menuMoveWish = '';
							 clearInterval(interval);
						};
					},8)
				}
			},
			//开始滑动
			handleTouchStart (e) {
				//监听卡片主题下的长按事件
				if (this.pageTheme === 'card') {
					//创建定时器,用于计算时间
					this.timer = setTimeout(() => {
						this.menuMoveWish = e.currentTarget.dataset.wishid;
						this.cardMenuState = true;
						clearTimeout(this.timer);
					}, 600)
					return;
				}
				
				//滑动状态打开
				this.touchStatus = true;
				//记录滑动初始位置
				this.startX = e.touches[0].clientX;
				this.startY = e.touches[0].clientY;
				//记录操作愿望ID
				if (!this.listMenuState) this.menuMoveWish = e.currentTarget.dataset.wishid;
			},
			handleTouchMove (e) {
				//判断是否为卡片主题
				if (this.pageTheme === 'card') return;
				//判断是否为滑动状态
				if (this.touchStatus) {
					
					//判断是否存在timer，如果有清除未执行timer
					if (this.timer) {
						clearTimeout(this.timer)
					}
					
					//创建timer延迟16ms执行
					this.timer = setTimeout(() => {
						if (!this.touchStatus) return;
						//获取当前滑动愿望ID
						let wishid = e.currentTarget.dataset.wishid;
						//获取当前用户滑动位置
						let touchX = e.touches[0].clientX;
						let touchY = e.touches[0].clientY;
						//计算移动距离
						let defferenceCount = touchX - this.startX;
						let defferenceCountX = Math.abs(defferenceCount);
						let defferenceCountY = Math.abs(touchY - this.startY);
						
						if (defferenceCountX > defferenceCountY && defferenceCountX > 20 && this.scrollDirection) {
							this.scrollDirection = false;
							this.startX -= 20;
						}
						
						if (this.scrollDirection) return;
						//计算移动距离占比
						//移动距离 / 总的移动距离 / 3
						let movePercent = defferenceCount / 120;
						//计算真实移动距离
						let temp_moveCount = Math.floor(380 * movePercent);
						
						//移动距离大于编辑区域距离时，置为编辑距离
						if (temp_moveCount < -380) temp_moveCount = -380;
						//移动距离大于起始位置时，置为0
						if (temp_moveCount > 0 && this.menuMoveCount < 0) {
							temp_moveCount =  -380 + temp_moveCount;
						}
						//排除由于移动距离过大，导致的列表跑版的问题
						if (temp_moveCount > 0) temp_moveCount = 0;
						
						this.menuMoveCount = temp_moveCount;
					}, 8)
				}
			},
			
			handleTouchEnd (e) {
				if (this.timer) {
				  clearTimeout(this.timer);
				  if (this.pageTheme === 'card') return; 
				}
				
				this.startX = 0;
				this.startY = 0;
				this.touchStatus = false;
				this.scrollDirection = true;
				this.menuMoveCount < -190 ? this.menuMoveCount = -380 : this.menuMoveCount = 0;
			},
			
			handleDelWishClick (wishId) {
				//判断愿望是否存在
				let wishIndex = this.wishData.wishIdArray.indexOf(wishId);
				if (wishIndex > -1) {
					//删除vuex中的愿望
					this.wishData.wishIdArray.splice(wishIndex, 1);
					let wish = this.wishData.wishObj[wishId];
					//删除愿望图片
					uni.removeSavedFile({
						filePath: wish.image,
						success() {
							console.log('delete wish image cache');
						}
					})
					//删除愿望缓存
					deleteWishById(wishId);
				}
			},
			
			handleEditWishClick (wishId) {
				if (this.pageTheme !== 'card') this.resetListMenu();
				uni.navigateTo({
					url: '../../../pages/wish/base/WishBase?wishId=' + wishId
				});
			},
			
			scroll: function(e) {
				this.old.scrollTop = e.detail.scrollTop
			}
		}
	}
</script>

<style lang="scss" scoped>
	.scroll-Y {
		background-color: #EEE;
		position: absolute;
		top: 238rpx;
		bottom: 30rpx;
		.wish-list {
			.wish-item {
				display: flex;
				align-items: center;
				position: relative;
				max-width: 100%;
				min-width: 80%;
				height: 180rpx;
				font-size: 32rpx;
				border-radius: 20rpx;
				margin: 0 30rpx 30rpx;
				padding: 0 30rpx 0 30rpx;
				background-color: #fff;
				transition: height 0.6s, max-width 0.6s, min-width 0.6s;
				&.convert {
					background-image: url('https://oss-yaodz-source.oss-cn-beijing.aliyuncs.com/Wish-List/img/bg.png');
				}
				.stamp {
					transform:rotate(-40deg);
					position: absolute;
					width: 90rpx;
					height: 90rpx;
					bottom: 20rpx;
					right: 20rpx;
					border-radius: 50%;
					border: 4rpx solid #ee2323;
					z-index: 10;
					.content {
						line-height: 90rpx;
						width: 90rpx;
						text-align: center;
						font-size: 30rpx;
						color: #ee2323;
						font-weight: bold;
					}
				}
				.image-wrapper {
					width: 120rpx;
					height: 120rpx;
					line-height: 120rpx;
					text-align: center;
					border: 2rpx solid #BBB;
					border-radius: 20rpx;
					overflow: hidden;
					.icon {
						font-size: 60rpx;
					}
					.image {
						width: 120rpx; 
						height: 120rpx;
					}
				}
				.wish-info {
					width: 400rpx;
					height: 130rpx;
					margin-left: 30rpx;
					.title {
						white-space:nowrap;
						overflow:hidden; 
						text-overflow:ellipsis;
						line-height: 70rpx;
						font-weight: bold;
						font-size: 40rpx;
					}
					.info {
						line-height: 50rpx;
						font-size: 32rpx;
						color: #9B9B9B;
					}
				}
				right: 0rpx;
				transition: height 0.6s, max-width 0.6s, min-width 0.6s, transform 0.6s;
				.wish-menu {
					position: absolute;
					right: -190rpx;
					top: 0;
					
					display: flex;
					flex-direction: column;
					justify-content: center;
					
					width: 160rpx;
					height: 180rpx;
					text-align: center;
					color: #fff;
					border-radius: 20rpx;
					font-size: 38rpx;
					.menu-icon {
						font-size: 48rpx;
					}
					.menu-title {
						margin-top: 10rpx;
					}
					&.wish-edit {
						z-index: 2;
					}
					&.wish-delete {
						z-index: 1;
						right: -190rpx;
						transition: right 0.4s;
					}
					&.wish-delete.open {
						right: -380rpx;
					}
				}
				&.card {
					z-index: 2;
					flex-direction: column;
					box-sizing: border-box;
					max-width: 45.5%;
					min-width: 45.5%;
					height: 380rpx;
					margin: 0 0 30rpx 3%;
					padding: 30rpx;
					.image-wrapper {
						width: 130rpx;
						height: 130rpx;
						.image {
							width: 130rpx; 
							height: 130rpx; 
						}
					}
					.wish-info {
						width: 100%;
						height: auto;
						margin-top: 26rpx;
						margin-left: 0rpx;
						.title {
							line-height: 52rpx;
							text-align: center;
							font-size: 38rpx;
							margin-bottom: 14rpx;
						}
						.info {
							font-size: 28rpx;
							text-align: center;
						}
					}
					.wish-menu {
						transform:rotateY(180deg);
						top: 0;
						left: 0;
						position: absolute;
					}
					&.reverse {
						transform:rotateY(180deg);
						.wish-menu {
							align-items: center;
							justify-content: flex-start;
							z-index: 1;
							width: 100%;
							height: 100%;
							background-color: #fff;
							overflow: hidden;
							.image-wrapper {
								margin-top: 20rpx;
								width: 120rpx;
								height: 120rpx;
							}
							.title {
								white-space:nowrap;
								overflow:hidden; 
								text-overflow:ellipsis;
								line-height: 70rpx;
								font-weight: bold;
								font-size: 36rpx;
								color: #101010;
							}
							.operate {
								display: flex;
								flex-wrap: wrap;
								align-items: center;
								width: 100%;
								.operate-item {
									display: flex;
									justify-content: center;
									align-items: center;
									width: 45.5%;
									margin-left: 3%;
									border-radius: 20rpx;
									&.cancel {
										margin-top: 16rpx;
										width: 94%;
									}
								}
							}
							.cancel {
								vertical-align: center;
							}
						}
					}
				}
			}
			&.card {
				display: flex;
				flex-wrap: wrap;
			}
		}
		.progress {
			height: 0rpx;
			border-bottom: 12rpx solid #13CDBB;
			border-bottom-left-radius: 12rpx;
			position: absolute;
			z-index: 2;
			bottom: 0;
			left: 0;
			right: auto;
		}
		.card .reverse .progress {
			transform:rotateY(180deg);
			right: 0;
			left: auto;
		}
		.progress.completed, .bgprogress {
			border-bottom-right-radius: 12rpx;
		}
		.bgprogress {
			width: 100%;
			z-index: 2;
			opacity: 0.2;
			&.view-progress {
				opacity: 0.8;
			}
		}
	}
</style>
