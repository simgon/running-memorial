class UsersController < ApplicationController
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

  private

  # ストロングパラメータ
  def user_params
    params.require(:user).permit(:allow_session_user_id_setting)
  end
end
