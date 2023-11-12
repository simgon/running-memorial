require 'test_helper'

class RoutesTest < ActionDispatch::IntegrationTest
  def setup
    @user = users(:user1)
    log_in_as(@user)
  end

  test 'should create a route on valid submission' do
    route_nm = 'New Route'
    assert_difference 'Route.count', 1 do
      post routes_path, params: { route: { name: route_nm, user_id: @user.id }, format: '' }
    end
    # assert_redirected_to routes_url
    # follow_redirect!
    assert_match route_nm, response.body
  end

  test 'should update a route on valid submission' do
    first_route = @user.routes.first
    route_nm = 'Updated Route'
    patch route_path(first_route), params: { id: first_route.id, route: { name: route_nm }, format: '' }
    # assert_redirected_to routes_url
    # follow_redirect!
    assert_match route_nm, response.body
  end

  test 'should create a copy route on valid submission' do
    first_route = @user.routes.first
    assert_difference 'Route.count', 1 do
      post '/routes/copy', params: { route: { id: first_route.id }, format: '' }
    end
    # assert_redirected_to routes_url
    # follow_redirect!
    assert_match "#{first_route.name}_コピー", response.body
  end

  test 'should delete a route on valid submission' do
    first_route = @user.routes.first
    assert_difference 'Route.count', -1 do
      delete route_path(first_route), xhr: true
    end
    # assert_redirected_to routes_url
    # follow_redirect!
    assert_no_match first_route.name, response.body
  end
end
