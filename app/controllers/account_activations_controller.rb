class AccountActivationsController < ApplicationController
  def edit
    user = User.find_by(email: params[:email])
    if user && !user.activated? && user.authenticated?(:activation, params[:id])
      user.activate
      # reset_session
      log_in user
      flash[:success] = t('messages.account_activations.edit.success')
    else
      flash[:danger] = t('messages.account_activations.edit.failure')
    end
    redirect_to root_url
  end
end
