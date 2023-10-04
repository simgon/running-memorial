class UsersController < ApplicationController
  before_action :admin_user, only: [:index, :destroy]
  # before_action :logged_in_user, only: [:edit, :update]
  # before_action :correct_user,   only: [:edit, :update]

  # ユーザー一覧
  def index
    @users = User.all
  end

  def new
    @user = User.new
  end

  def create
    # ユーザートークンが保持されている場合
    if (user_token = cookies.encrypted[:user_token])
      # ユーザートークンからユーザーを取得
      @user = User.find_by(user_token: user_token)
    end

    # ユーザーが存在しない または emailが設定済の場合
    if @user.nil? || @user.email.present?
      @user = User.new(user_params_create)
    else
      # ユーザートークンを引き継ぐ
      @user.update(user_params_create)
    end

    if @user.save
      reset_session
      log_in @user
      flash[:success] = "ようこそ"
      redirect_to routes_url
    else
      render 'new', status: :unprocessable_entity
    end
  end

  # 変更先ユーザーに変更
  def update
    # 現在ユーザー
    @user = User.find(params[:id])
    # 変更先ユーザー
    changedUser = User.where(user_token: params[:user][:changed_user_token]).first

    if @user.allow_session_user_id_setting && changedUser
      @user.allow_session_user_id_setting = false;

      if @user.update(user_params)
        flash[:success] = "更新しました"

        # クッキーに変更先ユーザーIDをセット
        set_cookies_user_id(changedUser)
      else
        flash[:success] = "更新できませんでした"
      end
    else
      flash[:success] = "更新できませんでした"
    end

    redirect_to routes_url
  end

  # ユーザー削除
  def destroy
    user = User.find(params[:id])
    if user.destroy
      flash[:success] = "削除しました"
      redirect_to users_url, status: :see_other
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
      unless logged_in?
        store_location
        flash[:danger] = "Please log in."
        redirect_to login_url, status: :see_other
      end
    end

    # 正しいユーザーかどうか確認
    def correct_user
      @user = User.find(params[:id])
      redirect_to(root_url, status: :see_other) unless current_user?(@user)
    end
end
