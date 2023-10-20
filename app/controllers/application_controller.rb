class ApplicationController < ActionController::Base
  include SessionsHelper

  # iOS(WKWebView)でのみInvalidAuthenticityTokenが発生する場合がある。（ブラウザ版とAndroid版では発生しない）
  # iOSアプリ側で対応する
  # Resque form for invalid authentificitytoken
  # rescue_from ActionController::InvalidAuthenticityToken, :with => :bad_token
  # def bad_token
  #   flash[:warning] = "Session expired"
  #   redirect_to routes_path
  # end

  # クッキーから値を取得
  def get_cookies_value(key)
    if Rails.env.test?
      cookies[key]
    else
      cookies.encrypted[key]
    end
  end

  # クッキーに値をセット
  def set_cookies_value(key, value)
    if Rails.env.test?
      cookies[key] = value
    else
      cookies.permanent.encrypted[key] = value
    end
  end

  # クッキーからユーザーIDを取得
  def get_cookies_user_id
    get_cookies_value(:user_id)
  end

  # クッキーにユーザーIDをセット
  def set_cookies_user_id(user)
    set_cookies_value(:user_id, user.id)
  end
end
