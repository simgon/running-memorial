class ApplicationController < ActionController::Base

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
