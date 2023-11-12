require 'test_helper'

class UsersControllerTest < ActionDispatch::IntegrationTest
  def setup
    @admin_user = users(:user1)
    @other_user = users(:user2)
  end

  test 'should redirect index when not logged in' do
    get users_path
    assert_redirected_to root_url
  end

  test 'should redirect index when logged in as not admin' do
    log_in_as(@other_user)
    get users_path
    assert_redirected_to root_url
  end

  test 'should get index when logged in as admin' do
    log_in_as(@admin_user)
    get users_path
    assert_response :success
  end

  test 'should redirect destroy when not logged in' do
    assert_no_difference 'User.count' do
      delete user_path(@other_user)
    end
    assert_redirected_to root_url
  end

  test 'should destroy user when logged in as admin' do
    log_in_as(@admin_user)
    assert_difference 'User.count', -1 do
      delete user_path(@other_user)
    end
    assert_redirected_to users_url
  end
end
