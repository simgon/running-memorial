class SessionsController < ApplicationController
  def new
  end

  def create
    user = User.find_by(email: params[:session][:email].downcase)
    if user && user.authenticate(params[:session][:password])
      if user.activated?
        forwarding_url = session[:forwarding_url]
        reset_session
        remember user
        log_in user

        flash[:autohide] = true
        flash[:success] = "ログインしました。"

        # redirect_to forwarding_url || routes_url
      else
        flash.now[:warning] = "アカウントが有効化されていません。メールをご確認ください。"
        # redirect_to routes_url
        render 'new', status: :unprocessable_entity
      end
    else
      flash.now[:danger] = "メールアドレスまたはパスワードが間違っています"
      # render 'static_pages/home', status: :unprocessable_entity
      # redirect_to routes_url
      render 'new', status: :unprocessable_entity
    end
  end

  def destroy
    log_out

    flash[:autohide] = true
    flash[:success] = "ログアウトしました。"

    # redirect_to root_url, status: :see_other
    redirect_to request.original_url, status: :see_other
  end
end
