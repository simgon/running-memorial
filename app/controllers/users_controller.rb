class UsersController < ApplicationController
  before_action :admin_user, only: [:index, :destroy]
  # before_action :logged_in_user, only: [:edit, :update]
  # before_action :correct_user,   only: [:edit, :update]

  # ユーザー一覧
  def index
    @users = User.order(admin: :desc, last_login_at: :desc)
  end

  def new
    @user = User.new
  end

  def create
    # ユーザートークンが保持されている場合（一度でもマップ画面を開いていた場合）
    if (user_token = cookies.encrypted[:user_token])
      # ユーザートークンからユーザーを取得
      @user = User.find_by(user_token:)
    end

    # ユーザーが存在しない または emailが設定済の場合
    if @user.nil? || @user.email.present?
      # ユーザーを新規作成
      @user = User.new(user_params_create)
    else
      # ユーザーを更新（ユーザートークンを引き継ぐ）
      @user.attributes = user_params_create
    end

    # 有効化トークンとダイジェストを作成および代入する
    @user.create_activation_digest

    if @user.save
      # 確認メール送信
      @user.send_activation_email
      flash[:autohide] = false
      flash[:success] = t('messages.users.create.success')

      # 一度もマップ画面を開いていない場合、ユーザートークンをセット
      cookies.permanent.encrypted[:user_token] = @user.user_token if cookies.permanent.encrypted[:user_token].blank?

      # redirect_to root_url
    else
      render 'new', status: :unprocessable_entity
    end
  end

  # 変更先ユーザーに変更
  def update
    # 現在ユーザー
    @user = User.find(params[:id])
    # 変更先ユーザー
    change_user = User.where(user_token: params[:user][:changed_user_token]).first

    if @user.allow_session_user_id_setting && change_user
      @user.allow_session_user_id_setting = false

      if @user.update(user_params)
        flash[:success] = t('messages.common.update.success')

        # クッキーに変更先ユーザーIDをセット
        cookies_user_id = change_user
      else
        flash[:success] = t('messages.common.update.failure')
      end
    else
      flash[:success] = t('messages.common.update.failure')
    end

    redirect_to routes_url
  end

  # ユーザー削除
  def destroy
    user = User.find(params[:id])
    if user.destroy
      flash[:success] = t('messages.common.destroy.success')
      redirect_to users_url, status: :see_other
    else
      render 'index', status: :see_other
    end
  end

  # アカウントの削除
  def account_destroy
    @user = current_user

    if @user.destroy
      flash[:success] = t('messages.users.account_destroy.succes')
      # redirect_to root_url, status: :see_other
      redirect_to request.original_url, status: :see_other
    else
      render 'index', status: :see_other
    end
  end

  private

  # ストロングパラメータ
  def user_params_create
    params.require(:user).permit(:email, :password, :password_confirmation)
  end

  def user_params
    params.require(:user).permit(:allow_session_user_id_setting)
  end

  # 管理者かどうか確認
  def admin_user
    redirect_to(root_url, status: :see_other) unless current_user&.admin?
  end

  # ログイン済みユーザーかどうか確認
  def logged_in_user
    return if logged_in?

    store_location
    flash[:danger] = 'Please log in.'
    redirect_to login_url, status: :see_other
  end

  # 正しいユーザーかどうか確認
  def correct_user
    @user = User.find(params[:id])
    redirect_to(root_url, status: :see_other) unless current_user?(@user)
  end
end
