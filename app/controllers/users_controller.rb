class UsersController < ApplicationController
  before_action :admin_user, only: [:index, :destroy]

  # ユーザー一覧
  def index
    @users = User.all
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

        redirect_to routes_url
      else
        flash[:success] = "更新できませんでした"
        render 'index', status: :unprocessable_entity
      end
    else
      flash[:success] = "更新できませんでした"
      redirect_to routes_url
    end
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
    def user_params
      params.require(:user).permit(:allow_session_user_id_setting)
    end

    # 管理者かどうか確認
    def admin_user
      redirect_to(root_url, status: :see_other) unless current_user&.admin?
    end
end
