require "test_helper"

class UsersControllerTest < ActionDispatch::IntegrationTest
  def setup
    @user = users(:user1)
    @changed_user = users(:user2)
  end

  test "should update user and set changed_user_id in cookies" do
    @user.allow_session_user_id_setting = true
    @user.save
    cookies[:user_id] = @user.id

    patch user_path(@user), params: { id: @user.id, user: { changed_user_token: @changed_user.user_token  } }

    assert_redirected_to routes_url
    assert_equal false, @user.reload.allow_session_user_id_setting
    assert_equal @changed_user.id, cookies[:user_id].to_i
  end

  test "should not update user with invalid params" do
    @user.allow_session_user_id_setting = false
    @user.save
    cookies[:user_id] = @user.id
    patch user_path(@user), params: { id: @user.id, user: { changed_user_token: "XXX" } }

    assert_redirected_to routes_url
    assert_not_equal @changed_user.id, cookies[:user_id].to_i
  end
end
