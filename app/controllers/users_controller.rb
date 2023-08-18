class UsersController < ApplicationController
  # 
  def update
    @user = User.find(params[:id])

    if @user.allow_session_user_id_setting
      @user.allow_session_user_id_setting = false;
      if @user.update(user_params)
        flash[:success] = "更新しました"
        redirect_to routes_url
      else
        render 'index', status: :unprocessable_entity
      end
    else
      redirect_to routes_url
    end
  end

  private

  # ストロングパラメータ
  def user_params
    params.require(:user).permit(:allow_session_user_id_setting)
  end
end
