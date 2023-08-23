require "test_helper"

class UsersControllerTest < ActionDispatch::IntegrationTest
  def setup
    @admin_user = users(:user1)
    @changed_user = users(:user2)
    @other_user = users(:user3)
  end

  test "should redirect index when not logged in" do
    get users_path
    assert_redirected_to root_url
  end

  test "should redirect index when logged in as not admin" do
    cookies[:user_id] = @other_user.id
    get users_path
    assert_redirected_to root_url
  end

  test "should get index when logged in as admin" do
    cookies[:user_id] = @admin_user.id
    get users_path
    assert_response :success
  end

  test "should redirect destroy when not logged in" do
    assert_no_difference 'User.count' do
      delete user_path(@other_user)
    end
    assert_redirected_to root_url
  end

  test "should destroy user when logged in as admin" do
    cookies[:user_id] = @admin_user.id
    assert_difference 'User.count', -1 do
      delete user_path(@other_user)
    end
    assert_redirected_to users_url
  end

  test "should update user and set changed_user_id in cookies" do
    @admin_user.allow_session_user_id_setting = true
    @admin_user.save
    cookies[:user_id] = @admin_user.id
    patch user_path(@admin_user), params: { id: @admin_user.id, user: { changed_user_token: @changed_user.user_token  } }

    assert_redirected_to routes_url
    assert_equal false, @admin_user.reload.allow_session_user_id_setting
    assert_equal @changed_user.id, cookies[:user_id].to_i
  end

  test "should not update user with invalid params" do
    @admin_user.allow_session_user_id_setting = false
    @admin_user.save
    cookies[:user_id] = @admin_user.id
    patch user_path(@admin_user), params: { id: @admin_user.id, user: { changed_user_token: "XXX" } }

    assert_redirected_to routes_url
    assert_not_equal @changed_user.id, cookies[:user_id].to_i
  end
end
